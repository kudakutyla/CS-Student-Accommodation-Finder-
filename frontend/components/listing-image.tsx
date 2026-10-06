'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { fetchMedia } from '../lib/api';

const FALLBACK_IMAGE = '/images/student-home-2.jpg';

export function ListingImage({
  src,
  alt,
  sizes,
  className = 'object-cover',
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const preferredSource = src || FALLBACK_IMAGE;
  const [mediaState, setMediaState] = useState<{ source: string; url: string | null; failed: boolean }>({ source: '', url: null, failed: false });
  const isUploadedMedia = preferredSource.startsWith('/media/');

  useEffect(() => {
    if (!isUploadedMedia) return;
    let active = true;
    let objectUrl = '';
    fetchMedia(preferredSource)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setMediaState({ source: preferredSource, url: objectUrl, failed: false });
      })
      .catch(() => setMediaState({ source: preferredSource, url: null, failed: true }));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isUploadedMedia, preferredSource]);

  const failedSource = mediaState.source === preferredSource && mediaState.failed;
  const uploadedSource = mediaState.source === preferredSource ? mediaState.url : null;
  const imageSource = failedSource
    ? FALLBACK_IMAGE
    : isUploadedMedia ? uploadedSource || FALLBACK_IMAGE : preferredSource;

  return (
    <Image
      src={imageSource}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized={imageSource.startsWith('http') || imageSource.startsWith('blob:')}
      onError={() => {
        if (imageSource !== FALLBACK_IMAGE) setMediaState({ source: preferredSource, url: null, failed: true });
      }}
      className={className}
    />
  );
}