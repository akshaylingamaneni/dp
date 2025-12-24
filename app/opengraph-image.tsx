import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Screenshot Composer - Beautiful Screenshot Backgrounds"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 168, 0.2) 0%, transparent 50%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M12 12v6" />
              <path d="M9 15h6" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: "white",
              margin: 0,
              textAlign: "center",
              letterSpacing: "-2px",
            }}
          >
            Screenshot Composer
          </h1>

          <p
            style={{
              fontSize: "28px",
              color: "rgba(255, 255, 255, 0.7)",
              margin: "24px 0 0 0",
              textAlign: "center",
              maxWidth: "800px",
            }}
          >
            Beautiful gradient backgrounds for your screenshots
          </p>

          <div
            style={{
              display: "flex",
              gap: "16px",
              marginTop: "48px",
            }}
          >
            {["Free", "Open Source", "No Sign-up"].map((tag) => (
              <div
                key={tag}
                style={{
                  padding: "12px 24px",
                  borderRadius: "9999px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: "18px",
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}

