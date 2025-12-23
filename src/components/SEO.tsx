import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'product';
    jsonLd?: Record<string, any>;
    storeName?: string;
}

export default function SEO({
    title,
    description = "Dookon - Kichik va o'rta biznes uchun eng qulay savdo tizimi. Ombor, kassa, va onlayn do'kon barchasi bitta joyda.",
    keywords = "savdo tizimi, kassir, ombor, do'kon, avtomatlashtirish, saas, uzbekistan, erp, crm",
    image = "https://dookon.uz/og-image.jpg",
    url = "https://dookon.uz",
    type = "website",
    jsonLd,
    storeName
}: SEOProps) {

    const siteTitle = storeName ? `${title} | ${storeName}` : (title ? `${title} | Dookon` : "Dookon - Zamonaviy Savdo Tizimi");

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{siteTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <link rel="canonical" href={url} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content={storeName || "Dookon"} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={url} />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Structured Data (JSON-LD) */}
            {jsonLd && (
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            )}
        </Helmet>
    );
}
