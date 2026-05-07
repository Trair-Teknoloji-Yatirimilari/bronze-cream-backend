import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Born To Bronze",
  description:
    "Terms of service for the Born To Bronze mobile application by Eda Taşpınar.",
};

export default function TermsOfServicePage() {
  return (
    <div
      style={{
        maxWidth: "860px",
        margin: "0 auto",
        padding: "48px 24px 96px",
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: "#1c1c1e",
        lineHeight: 1.65,
      }}
    >
      <h1 style={{ fontSize: "34px", marginBottom: "8px" }}>
        Kullanım Şartları — Born To Bronze
      </h1>

      <p style={{ marginBottom: "20px", color: "#6b6b70", fontSize: "14px" }}>
        Son Güncelleme: 7 Mayıs 2026
      </p>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "12px" }}>
          1. Hizmet Tanımı
        </h2>
        <p style={{ lineHeight: "1.6" }}>
          Born To Bronze, Eda Taşpınar markasının bronzlaştırıcı ürünlerini
          satın almadan önce sanal olarak denemenizi sağlayan resmi mobil
          uygulamasıdır. Kullanıcılar, fotoğraflarına veya gerçek zamanlı
          kamera görüntülerine bronzlaştırıcı efekti uygulayabilir, sonuçlarını
          paylaşabilir ve doğrudan www.edataspinar.com üzerinden ürün satın
          alabilir.
        </p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "12px" }}>
          2. Kullanım Koşulları
        </h2>
        <ul style={{ lineHeight: "1.8", marginLeft: "20px" }}>
          <li>Uygulamayı yalnızca yasal amaçlarla kullanabilirsiniz.</li>
          <li>
            Başkalarının haklarını ihlal eden içerik paylaşamazsınız.
          </li>
          <li>
            Uygulamanın güvenliğini tehlikeye atacak eylemlerden kaçınmalısınız.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "12px" }}>
          3. Fikri Mülkiyet
        </h2>
        <p style={{ lineHeight: "1.6" }}>
          Uygulamanın tasarımı, kodu ve arayüzü uygulama sağlayıcısına aittir.
          Uygulamada yer alan Eda Taşpınar markası, ürün görselleri ve marka
          içerikleri Eda Taşpınar&apos;ın mülkiyetindedir. İzinsiz kullanım,
          kopyalama veya dağıtım yasaktır.
        </p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "12px" }}>
          4. Sorumluluk Reddi
        </h2>
        <p style={{ lineHeight: "1.6" }}>
          Uygulama &quot;olduğu gibi&quot; sunulmaktadır. Sanal test sonuçları
          gerçek ürün sonuçlarından farklılık gösterebilir. Cilt tonu, uygulama
          tekniği ve ürün miktarı gibi faktörler nihai sonucu etkileyebilir.
        </p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "12px" }}>5. İletişim</h2>
        <p style={{ lineHeight: "1.6" }}>
          Kullanım şartları hakkında sorularınız için:
          <br />
          E-posta:{" "}
          <a href="mailto:info@edataspinar.com">info@edataspinar.com</a>
          <br />
          Web:{" "}
          <a href="https://www.edataspinar.com">
            https://www.edataspinar.com
          </a>
        </p>
        <p
          style={{
            marginTop: "20px",
            color: "#6b6b70",
            fontSize: "13px",
            lineHeight: "1.6",
          }}
        >
          © 2026 Eda Taşpınar. Tüm hakları saklıdır. Born To Bronze, Eda
          Taşpınar bronzlaştırıcı ürün serisinin resmi mobil uygulamasıdır.
        </p>
      </section>
    </div>
  );
}
