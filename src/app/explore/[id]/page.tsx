import { Metadata } from 'next';
import { contentDetailService, ContentDetailProvider } from '@/services/business/ContentDetailService';
import { contributionContentService } from '@/services/business/ContributionContentService';
import { ContributionCustomFields } from '@/types/contributions';
import { ContributionDetail } from '@/components/pages/ContributionDetail';
import { ContentNotFound } from '@/components/generic/ContentNotFound';
import { ContributionJsonLd } from '@/components/seo/ContributionJsonLd';

export const dynamic = 'force-dynamic';

type ContributionPageProps = {
  params: Promise<{ id: string }>;
};

// Register contribution provider (cast needed due to generic type constraints)
contentDetailService.registerProvider(
  'contribute',
  contributionContentService as ContentDetailProvider
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const result = await contentDetailService.getContentDetail<ContributionCustomFields>(
      'contribute',
      decodedId
    );

    if (!result.success || !result.content) {
      return {
        title: 'Contribution Not Found',
        description: 'The contribution you are looking for could not be found.',
      };
    }

    const { content } = result;
    return {
      title: `${content.title} | Nomad Contributions`,
      description: content.summary || content.description || 'View this nomad contribution',
      openGraph: {
        title: content.title,
        description: content.summary || content.description || 'View this nomad contribution',
        images: content.media[0]?.source?.url ? [{ url: content.media[0].source.url }] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Contribution | NomadCoin',
      description: 'View nomad contributions',
    };
  }
}

export default async function ContributionPage({ params }: ContributionPageProps) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const result = await contentDetailService.getContentDetail<ContributionCustomFields>(
      'contribute',
      decodedId
    );

    if (!result.success || !result.content) {
      return <ContentNotFound />;
    }

    const { content } = result;

    // Prepare JSON-LD data
    const jsonLdData = {
      id: content.id,
      dTag: decodedId,
      title: content.title,
      description: content.description || content.summary || '',
      category: content.customFields.category || 'General',
      contributionType: content.customFields.contributionType,
      location: content.customFields.location,
      region: content.customFields.region,
      country: content.customFields.country,
      language: content.customFields.language,
      publishedAt: content.publishedAt,
      updatedAt: content.updatedAt,
      author: {
        name: content.author?.displayName || 'Anonymous Nomad',
        npub: content.author?.npub,
      },
      image: content.media[0]?.source?.url,
      tags: content.tags,
    };

    return (
      <>
        <ContributionJsonLd contribution={jsonLdData} />
        <div className="min-h-screen bg-primary-50">
          <div className="container-width py-10 space-y-10">
            <ContributionDetail detail={content} />
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error('Error loading contribution:', error);
    return <ContentNotFound />;
  }
}

