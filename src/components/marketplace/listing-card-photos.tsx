import Image from "next/image";

const FALLBACK_FOOD =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80";

type Props = {
  imageUrls?: string[];
  title: string;
};

/**
 * Food photos for marketplace cards. Uses a neutral placeholder when no URLs are provided.
 */
export function ListingCardPhotos({ imageUrls, title }: Props) {
  const list =
    imageUrls && imageUrls.length > 0 ? imageUrls.slice(0, 3) : [FALLBACK_FOOD];

  if (list.length === 1) {
    return (
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-neutral-100">
        <Image
          src={list[0]}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 640px"
        />
      </div>
    );
  }

  return (
    <div
      className={`grid gap-1.5 ${list.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}
    >
      {list.map((src, index) => (
        <div
          key={`${src}-${index}`}
          className="relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100"
        >
          <Image
            src={src}
            alt={`${title} — photo ${index + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 200px"
          />
        </div>
      ))}
    </div>
  );
}
