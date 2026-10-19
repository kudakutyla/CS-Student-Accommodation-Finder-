import type { NextConfig } from "next";

const apiTarget = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.spu.ac.za',
        pathname: '/wp-content/uploads/2026/02/signature-picture.jpg',
      },
      {
        protocol: 'https',
        hostname: 'www.mandela.ac.za',
        pathname: '/www/media/Store/images/On%20campus/Campus%20information%20and%20maps/South.jpg',
      },
      {
        protocol: 'https',
        hostname: 'uct.ac.za',
        pathname: '/sites/default/files/content_migration/uct_ac_za/49/images/UCT_view-from-plaza-on-upper-campus.jpg',
      },
      {
        protocol: 'https',
        hostname: 'www.ul.ac.za',
        pathname: '/wp-content/uploads/2023/10/Campus.png',
      },
      {
        protocol: 'https',
        hostname: 'www.ump.ac.za',
        pathname: '/getmedia/35bf35e7-676d-4457-a550-93a1aa1f11ef/CampusM.jpg.aspx',
      },
      {
        protocol: 'https',
        hostname: 'virtualcampus.up.ac.za',
        pathname: '/wp-content/uploads/2018/06/hatfield.jpg',
      },
      {
        protocol: 'https',
        hostname: 'www.unisa.ac.za',
        pathname: '/static/corporate_web/Content/About/Unisa%20Visitors%20Guide/images/unisa-campuses-muckleneuk.jpg',
      },
      {
        protocol: 'https',
        hostname: 'www.wits.ac.za',
        pathname: '/media/wits-university/centenary/images/priorities/Panorama-view-of-Braamfontein-campus.png',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: `${apiTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
