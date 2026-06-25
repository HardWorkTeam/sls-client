"use client";

import { WeddingPage } from "@/components/layout/wedding-page";
import { GalleryTab } from "@/components/wedding/gallery-tab";

export default function GalleryPage() {
  return (
    <WeddingPage
      title="Gallery"
      description="Upload photos and videos, organize albums and share memories."
      requires="gallery"
    >
      {(wedding) => <GalleryTab weddingId={wedding.id} />}
    </WeddingPage>
  );
}
