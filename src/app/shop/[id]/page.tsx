import { Metadata } from 'next';
import { fetchProductById } from '@/services/business/ShopService';
import { ContentNotFound } from '@/components/generic/ContentNotFound';

// Temporary: ProductDetail component will be created in Phase 10
// For now, render basic product info directly
import Image from 'next/image';
import { MapPin, Tag, Package, MessageCircle } from 'lucide-react';

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
      <div className="min-h-screen bg-primary-50 py-10">
        <div className="container-width space-y-10">
          {/* Temporary simple product detail view - Phase 10 will add ProductDetail component */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Image */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {product.media.images[0] ? (
                  <Image
                    src={product.media.images[0].url}
                    alt={product.title}
                    width={600}
                    height={600}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-24 h-24 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
                    {product.title}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{product.location}</span>
                  </div>
                </div>

                <div className="text-4xl font-bold text-purple-800">
                  {product.currency === 'sats' 
                    ? `${product.price.toLocaleString()} sats`
                    : product.currency === 'BTC'
                    ? `₿${product.price}`
                    : `$${product.price}`
                  }
                </div>

                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {product.category}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {product.condition}
                  </span>
                </div>

                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
                </div>

                {product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Contact</p>
                  <p className="text-gray-900">{product.contact}</p>
                </div>

                <button className="btn-primary w-full flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Contact Seller
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading product:', error);
    return <ContentNotFound />;
  }
}
