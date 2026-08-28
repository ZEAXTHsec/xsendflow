import os
import sys
import time

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

import oci

def main():
    print("[*] Connecting to Oracle Cloud Infrastructure (OCI)...")
    config = oci.config.from_file(r"C:\Users\Afyie\.oci\config", "DEFAULT")
    tenancy_id = config["tenancy"]
    
    identity = oci.identity.IdentityClient(config)
    compute = oci.core.ComputeClient(config)
    vcn_client = oci.core.VirtualNetworkClient(config)
    
    ad_list = identity.list_availability_domains(tenancy_id).data
    ad_name = ad_list[0].name
    
    # Get Subnet
    vcns = vcn_client.list_vcns(compartment_id=tenancy_id).data
    vcn_id = vcns[0].id
    subnets = vcn_client.list_subnets(compartment_id=tenancy_id, vcn_id=vcn_id).data
    subnet_id = subnets[0].id
    
    with open(r"C:\Users\Afyie\.oci\xsendflow_vps.key.pub", "r", encoding="utf-8") as f:
        pub_ssh_key = f.read()

    # Try 1 OCPU Ampere first, if out of capacity try AMD Always Free
    shapes_to_try = [
        {"shape": "VM.Standard.A1.Flex", "ocpus": 1.0, "memory": 6.0, "arch": "aarch64"},
        {"shape": "VM.Standard.E2.1.Micro", "ocpus": None, "memory": None, "arch": "x86_64"}
    ]
    
    for opt in shapes_to_try:
        shape_name = opt["shape"]
        print(f"\n[*] Attempting Always Free Shape: {shape_name}...")
        
        # Find Ubuntu Image
        images = compute.list_images(
            compartment_id=tenancy_id,
            operating_system="Canonical Ubuntu",
            shape=shape_name,
            sort_by="TIMECREATED",
            sort_order="DESC"
        ).data
        
        if not images:
            print(f"[!] No images found for shape {shape_name}")
            continue
            
        image_id = images[0].id
        print(f"[+] Found Image: {images[0].display_name}")
        
        shape_config = None
        if opt["ocpus"] and opt["memory"]:
            shape_config = oci.core.models.LaunchInstanceShapeConfigDetails(
                ocpus=opt["ocpus"],
                memory_in_gbs=opt["memory"]
            )
            
        instance_details = oci.core.models.LaunchInstanceDetails(
            compartment_id=tenancy_id,
            availability_domain=ad_name,
            display_name=f"xsendflow-{shape_name.lower().replace('.', '-')}",
            shape=shape_name,
            shape_config=shape_config,
            image_id=image_id,
            subnet_id=subnet_id,
            metadata={"ssh_authorized_keys": pub_ssh_key},
            is_pv_encryption_in_transit_enabled=True
        )
        
        try:
            launch_res = compute.launch_instance(instance_details).data
            instance_id = launch_res.id
            print(f"[+] VM Creation Initiated! Instance OCID: {instance_id}")
            
            print("[*] Waiting for Server to start (PROVISIONING -> RUNNING)...")
            while True:
                inst = compute.get_instance(instance_id).data
                print(f"    State: {inst.lifecycle_state}...")
                if inst.lifecycle_state == "RUNNING":
                    break
                elif inst.lifecycle_state in ["TERMINATED", "FAILED"]:
                    print(f"[!] Instance failed: {inst.lifecycle_state}")
                    break
                time.sleep(8)
                
            vnic_attachments = compute.list_vnic_attachments(compartment_id=tenancy_id, instance_id=instance_id).data
            if vnic_attachments:
                vnic = vcn_client.get_vnic(vnic_attachments[0].vnic_id).data
                public_ip = vnic.public_ip
                priv_key_path = r"C:\Users\Afyie\.oci\xsendflow_vps.key"
                print("\n" + "="*60)
                print("🎉 ORACLE ALWAYS FREE VPS IS LIVE & RUNNING!")
                print(f"📍 Public IPv4 Address: {public_ip}")
                print(f"🔑 SSH Login User:      ubuntu")
                print(f"🔑 SSH Private Key:     {priv_key_path}")
                print(f"💻 SSH Command:         ssh -i \"{priv_key_path}\" ubuntu@{public_ip}")
                print(f"⚡ Compute Shape:       {shape_name} (100% Always Free $0/mo)")
                print("="*60 + "\n")
                return
        except Exception as e:
            print(f"[!] {shape_name} capacity notice: {e}")

if __name__ == "__main__":
    main()
