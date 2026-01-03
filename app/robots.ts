import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/reports/'],
        },
        sitemap: 'https://pawarlab.com/sitemap.xml',
    };
}
