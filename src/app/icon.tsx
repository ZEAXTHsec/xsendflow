import { ImageResponse } from 'next/og';



// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation for Favicon
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: 'linear-gradient(135deg, #0b1022 0%, #161b38 50%, #1e1435 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '8px',
          border: '1.5px solid rgba(99, 102, 241, 0.6)',
          fontWeight: 900,
          position: 'relative',
        }}
      >
        <span
          style={{
            background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 50%, #a855f7 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            fontSize: '18px',
            lineHeight: 1,
            fontWeight: 900,
          }}
        >
          X
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
