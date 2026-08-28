import sys
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

import oci

def main():
    config = oci.config.from_file(r"C:\Users\Afyie\.oci\config", "DEFAULT")
    tenancy_id = config["tenancy"]
    vcn_client = oci.core.VirtualNetworkClient(config)
    
    vcns = vcn_client.list_vcns(compartment_id=tenancy_id).data
    for v in vcns:
        print(f"[*] Checking Security Lists for VCN: {v.display_name}...")
        sl_list = vcn_client.list_security_lists(compartment_id=tenancy_id, vcn_id=v.id).data
        for sl in sl_list:
            print(f"[+] Updating Security List: {sl.display_name}...")
            # Ingress for 22, 80, 443, 3000, and all ICMP ping
            rules = [
                oci.core.models.IngressSecurityRule(
                    protocol="6", # TCP
                    source="0.0.0.0/0",
                    tcp_options=oci.core.models.TcpOptions(destination_port_range=oci.core.models.PortRange(min=p, max=p)),
                    description=f"Allow Port {p}"
                )
                for p in [22, 80, 443, 3000, 8080]
            ]
            rules.append(
                oci.core.models.IngressSecurityRule(
                    protocol="1", # ICMP
                    source="0.0.0.0/0",
                    description="Allow Ping"
                )
            )
            vcn_client.update_security_list(
                sl.id,
                oci.core.models.UpdateSecurityListDetails(
                    ingress_security_rules=rules
                )
            )
            print(f"✅ Ports 22, 80, 443, 3000, 8080 Opened on {sl.display_name}!")

if __name__ == "__main__":
    main()
