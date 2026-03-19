import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "NAGAN Planner",
        short_name: "NAGAN Planner",
        description:
            "Aplicación para iglesias, servicios y gestión de actividades.",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
            {
                src: "/pwa-64x64.png",
                sizes: "64x64",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/pwa-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/pwa-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/maskable-icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
    };
}
