import { Metadata } from 'next';
import { fetchProductById } from '@/services/business/ShopService';
import { ContentNotFound } from '@/components/generic/ContentNotFound';
import { ProductDetail } from '@/components/pages/ProductDetail';

export const dynamic = 'force-dynamic';

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const product = await fetchProductById(decodedId);

    if (!product) {
      return {
        title: 'Product Not Found',
        description: 'The product you are looking for could not be found.',
      };
    }

    return {
      title: `${product.title} | Shop`,
      description: product.description || `${product.title} - ${product.price} ${product.currency}`,
      openGraph: {
        title: product.title,
        description: product.description || `${product.title} - ${product.price} ${product.currency}`,
        images: product.media.images[0]?.url ? [{ url: product.media.images[0].url }] : [],
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
    const product = await fetchProductById(decodedId);

    if (!product) {
      return <ContentNotFound />;
    }

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
