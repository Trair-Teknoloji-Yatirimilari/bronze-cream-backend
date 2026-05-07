import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Born To Bronze",
  description:
    "Born To Bronze privacy policy covering data collection, face data processing, storage and user rights.",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "860px",
  margin: "0 auto",
  padding: "48px 24px 96px",
  fontFamily:
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  color: "#1c1c1e",
  lineHeight: 1.65,
};

const h1Style: React.CSSProperties = {
  fontSize: "34px",
  fontWeight: 700,
  marginBottom: "8px",
};

const h2Style: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 600,
  marginTop: "32px",
  marginBottom: "12px",
  borderBottom: "1px solid #e5e5ea",
  paddingBottom: "6px",
};

const h3Style: React.CSSProperties = {
  fontSize: "17px",
  fontWeight: 600,
  marginTop: "18px",
  marginBottom: "6px",
};

const pStyle: React.CSSProperties = {
  fontSize: "15px",
  marginBottom: "12px",
};

const ulStyle: React.CSSProperties = {
  fontSize: "15px",
  paddingLeft: "22px",
  marginBottom: "12px",
};

const calloutStyle: React.CSSProperties = {
  background: "#FFF8E7",
  border: "1px solid #F4E1A1",
  borderRadius: "10px",
  padding: "16px 18px",
  margin: "16px 0",
  fontSize: "14.5px",
};

export default function PrivacyPolicyPage() {
  return (
    <div style={containerStyle}>
      <h1 style={h1Style}>Privacy Policy — Born To Bronze</h1>
      <p style={{ color: "#6b6b70", marginBottom: "24px", fontSize: "14px" }}>
        Last updated: May 7, 2026 &nbsp;|&nbsp; Effective date: May 7, 2026
      </p>

      <p style={pStyle}>
        Born To Bronze (“the App”, “we”, “us”) is the official mobile
        application of the Eda Taşpınar self-tanning product line. It lets
        users virtually try Eda Taşpınar self-tanning products on their own
        face using the device camera or a selected photo. This policy explains
        what data we process, how face data is handled, where it is stored and
        what rights users have. It applies globally and complies with Apple
        App Store Review Guideline 5.1.1, GDPR and Turkish KVKK (Law No.
        6698).
      </p>

      {/* Turkish summary */}
      <div style={calloutStyle}>
        <strong>Türkçe Özet:</strong> Born To Bronze, Eda Taşpınar markasının
        bronzlaştırıcı ürünlerini yüzünüzde sanal olarak denemeniz için kamera
        ve galeri erişimi kullanır. Yüz verileri{" "}
        <strong>yalnızca cihazınızda gerçek zamanlı işlenir</strong>,
        sunucularımıza yüklenmez, üçüncü taraflarla paylaşılmaz ve saklanmaz.
      </div>

      {/* 1. Data We Collect */}
      <h2 style={h2Style}>1. Data We Collect</h2>

      <h3 style={h3Style}>1.1 Information You Provide</h3>
      <ul style={ulStyle}>
        <li>Photos you explicitly select from your photo library.</li>
        <li>
          Photos you save to your library after editing (only when you tap
          “Save”).
        </li>
        <li>Feedback or support messages you send to us.</li>
      </ul>

      <h3 style={h3Style}>1.2 Information Collected Automatically</h3>
      <ul style={ulStyle}>
        <li>
          Device model, operating system version, app version, language and
          region.
        </li>
        <li>
          Anonymous usage metrics (screens viewed, feature taps) to improve the
          product.
        </li>
        <li>
          Crash and performance data via Sentry (stack traces, device type).
          This does not include photos, camera frames or face data.
        </li>
      </ul>

      <h3 style={h3Style}>1.3 Information We Do NOT Collect</h3>
      <ul style={ulStyle}>
        <li>Location data</li>
        <li>Microphone audio</li>
        <li>Contacts, calendar, health or financial data</li>
        <li>
          Face recognition templates, face prints or biometric identifiers
        </li>
      </ul>

      {/* 2. Face Data — Apple Guideline 2.1 / 5.1.1 */}
      <h2 style={h2Style}>2. Face Data</h2>
      <p style={pStyle}>
        Born To Bronze uses on-device face detection to correctly place the
        tanning effect on the user’s face (forehead, cheeks, chin area). The
        following section directly answers Apple App Review’s questions about
        face data.
      </p>

      <h3 style={h3Style}>2.1 What face data does the app collect?</h3>
      <p style={pStyle}>
        The App performs <strong>real-time face contour detection</strong> on
        the live camera preview or a photo you pick from your library, using
        the on-device Google ML Kit face detector bundled via the{" "}
        <em>react-native-vision-camera-face-detector</em> library. The detector
        produces temporary geometric contour points (face outline, cheeks,
        eyes, eyebrows, lips) that are used to build a clipping mask for the
        tanning filter.
      </p>
      <p style={pStyle}>
        The App does <strong>not</strong> collect, compute or store face
        embeddings, face prints, Face ID data, biometric templates or any
        identifier capable of recognizing a person. No face data leaves the
        device.
      </p>

      <h3 style={h3Style}>2.2 What is the face data used for?</h3>
      <ul style={ulStyle}>
        <li>
          Determining where to draw the virtual self-tan color so it only
          covers skin regions and avoids eyes, eyebrows, nostrils and lips.
        </li>
        <li>
          Adjusting the intensity and spread of the effect to the size of the
          user’s face in the frame.
        </li>
      </ul>
      <p style={pStyle}>
        The contour data exists only for the duration of a single frame
        (milliseconds) and is overwritten by the next frame. Nothing about the
        user’s face is persisted.
      </p>

      <h3 style={h3Style}>
        2.3 Is face data shared with any third parties? Where is it stored?
      </h3>
      <p style={pStyle}>
        <strong>No.</strong> Face data is never shared with any third party,
        advertising network, analytics provider or backend server. It is never
        written to disk, never uploaded and never backed up. All face
        processing happens locally on the user’s device using on-device
        machine learning models.
      </p>

      <h3 style={h3Style}>2.4 How long is face data retained?</h3>
      <p style={pStyle}>
        Face contour data is retained only in volatile memory for the duration
        of a single video frame or photo preview (typically less than 50
        milliseconds) and is discarded immediately after the filter is
        rendered. Retention time: <strong>zero persistent storage</strong>.
      </p>

      <h3 style={h3Style}>
        2.5 Where in this policy is face data handling described?
      </h3>
      <p style={pStyle}>
        The full description of collection, use, disclosure, sharing and
        retention of face data is in <strong>Section 2 (Face Data)</strong> of
        this document, specifically subsections 2.1 through 2.4.
      </p>

      <div style={calloutStyle}>
        <strong>Quote from policy (for App Review):</strong>{" "}
        “Born To Bronze performs real-time face contour detection on the live
        camera preview or a photo chosen by the user, entirely on-device. The
        resulting contour points exist only in volatile memory for the
        duration of a single frame and are used solely to clip the virtual
        tanning filter to skin regions. No face data is uploaded, shared with
        third parties, or persisted to storage.”
      </div>

      {/* 3. Camera & Photo Library */}
      <h2 style={h2Style}>3. Camera and Photo Library Access</h2>
      <ul style={ulStyle}>
        <li>
          <strong>Camera:</strong> Used only while the real-time try-on screen
          is open. Frames are processed on-device and never uploaded.
        </li>
        <li>
          <strong>Photo Library (read):</strong> Used only when you tap the
          gallery button to choose a photo to apply the effect on. We receive
          only the photos you explicitly pick.
        </li>
        <li>
          <strong>Photo Library (add):</strong> Used only when you tap “Save”
          to export the edited image back to your library.
        </li>
      </ul>

      {/* 4. Legal Basis */}
      <h2 style={h2Style}>4. Legal Basis for Processing</h2>
      <p style={pStyle}>
        Under GDPR, processing is based on (a) your explicit consent given
        through iOS / Android permission dialogs and (b) legitimate interest in
        providing the core functionality you requested. Under KVKK, processing
        is based on explicit consent (açık rıza) and necessity for the
        performance of the service.
      </p>

      {/* 5. Third-Party Services */}
      <h2 style={h2Style}>5. Third-Party Services</h2>
      <ul style={ulStyle}>
        <li>
          <strong>Sentry</strong> — crash reporting. Receives device model, OS,
          app version and anonymized stack traces. Does not receive photos or
          face data.
        </li>
        <li>
          <strong>Expo / EAS</strong> — build and over-the-air update delivery.
          Does not receive user content.
        </li>
        <li>
          <strong>Google ML Kit (on-device)</strong> — bundled face detection
          library that runs locally. No network calls.
        </li>
      </ul>

      {/* 6. Data Security */}
      <h2 style={h2Style}>6. Data Security</h2>
      <p style={pStyle}>
        Network communications with our servers use TLS 1.2+. Account data, if
        any, is stored encrypted at rest. Face data never reaches our servers.
      </p>

      {/* 7. Children */}
      <h2 style={h2Style}>7. Children</h2>
      <p style={pStyle}>
        The App is not directed to children under 13. We do not knowingly
        collect data from children. If you believe a child has used the App,
        please contact us and we will delete any associated data.
      </p>

      {/* 8. Your Rights */}
      <h2 style={h2Style}>8. Your Rights</h2>
      <p style={pStyle}>
        Depending on your jurisdiction (GDPR, KVKK, CCPA) you have the right to
        access, rectify, delete, restrict processing, object to processing and
        port your personal data. You may revoke camera and photo library
        permissions at any time from your device settings. To exercise these
        rights, contact us using the details below.
      </p>

      {/* 9. Changes */}
      <h2 style={h2Style}>9. Changes to This Policy</h2>
      <p style={pStyle}>
        We may update this policy to reflect changes in the App or applicable
        law. The “Last updated” date at the top shows the current version.
        Material changes will be communicated through the App.
      </p>

      {/* 10. Contact */}
      <h2 style={h2Style}>10. Contact</h2>
      <p style={pStyle}>
        Data Controller: Eda Taşpınar
        <br />
        Email: <a href="mailto:info@edataspinar.com">info@edataspinar.com</a>
        <br />
        Website:{" "}
        <a href="https://www.edataspinar.com">https://www.edataspinar.com</a>
      </p>
      <p style={{ ...pStyle, color: "#6b6b70", fontSize: "13px" }}>
        © 2026 Eda Taşpınar. All rights reserved. Born To Bronze is the
        official mobile application of the Eda Taşpınar self-tanning product
        line.
      </p>
    </div>
  );
}
