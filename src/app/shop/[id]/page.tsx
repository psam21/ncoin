import { Metadata } from 'next';
import { contentDetailService, ContentDetailProvider } from '@/services/business/ContentDetailService';
import { shopContentService, type ShopCustomFields } from '@/services/business/ShopContentService';
import { ContentNotFound } from '@/components/generic/ContentNotFound';
import { ProductDetail } from '@/components/pages/ProductDetail';

export const dynamic = 'force-dynamic';

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

// Register shop provider (cast needed due to generic type constraints)
contentDetailService.registerProvider(
  'shop',
  shopContentService as ContentDetailProvider
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const result = await contentDetailService.getContentDetail<ShopCustomFields>(
      'shop',
      decodedId
    );

    if (!result.success || !result.content) {
      return {
        title: 'Product Not Found',
        description: 'The product you are looking for could not be found.',
      };
    }

    const { content } = result;
    return {
      title: `${content.title} | Shop`,
      description: content.description || `${content.title} - ${content.customFields.price} ${content.customFields.currency}`,
      openGraph: {
        title: content.title,
        description: content.description || `${content.title} - ${content.customFields.price} ${content.customFields.currency}`,
        images: content.media[0]?.source.url ? [{ url: content.media[0].source.url }] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Product | ncoin Shop',
      description: 'View product details',
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const result = await contentDetailService.getContentDetail<ShopCustomFields>(
      'shop',
      decodedId
    );

    if (!result.success || !result.content) {
      return <ContentNotFound />;
    }

    // Convert ContentDetail to ProductEvent format for ProductDetail component
    const { content } = result;
    const product = {
      id: content.id,
      dTag: decodedId,
      pubkey: content.author.pubkey,
      title: content.title,
      summary: content.summary || '',
      description: content.description,
      price: content.customFields.price,
      currency: content.customFields.currency,
      category: content.customFields.category,
      condition: content.customFields.condition,
      location: content.customFields.location,
      contact: content.customFields.contact,
      tags: content.tags,
      media: {
        images: content.media.filter(m => m.type === 'image').map(m => ({
          url: m.source.url,
          mimeType: m.source.mimeType,
          hash: m.source.hash,
          size: m.source.size,
        })),
        videos: content.media.filter(m => m.type === 'video').map(m => ({
          url: m.source.url,
          mimeType: m.source.mimeType,
          hash: m.source.hash,
          size: m.source.size,
        })),
        audio: content.media.filter(m => m.type === 'audio').map(m => ({
          url: m.source.url,
          mimeType: m.source.mimeType,
          hash: m.source.hash,
          size: m.source.size,
        })),
      },
      createdAt: content.publishedAt,
      publishedAt: content.publishedAt,
    };

    return (
      <div className="min-h-screen bg-primary-50">
        <div className="container-width py-10">
          <ProductDetail product={product} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading product:', error);
    return <ContentNotFound />;
  }
}
