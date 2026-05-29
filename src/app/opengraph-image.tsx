import { ImageResponse } from "next/og";

export const alt = "HazardPin — Community Road Hazard Reporter";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#059669",
          backgroundImage: "linear-gradient(135deg, #047857 0%, #059669 50%, #065f46 100%)",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 250,
            height: 250,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.05)",
          }}
        />

        {/* Pin emoji */}
        <div style={{ fontSize: 72, marginBottom: 16 }}>📍</div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: "white",
            letterSpacing: "-2px",
            marginBottom: 8,
          }}
        >
          HazardPin
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: "rgba(255,255,255,0.8)",
            fontWeight: 500,
            marginBottom: 32,
          }}
        >
          Pin it. Verify it. Fix it.
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.6)",
            maxWidth: 600,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Community-powered road hazard reporting. Spot dangers, pin them on the map, and let your neighbors verify.
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 14,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          hazardpin.moikapy.workers.dev
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}