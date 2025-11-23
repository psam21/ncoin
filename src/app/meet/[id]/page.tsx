import { Metadata } from 'next';
import { contentDetailService, ContentDetailProvider } from '@/services/business/ContentDetailService';
import { meetContentService, type MeetCustomFields } from '@/services/business/MeetContentService';
import { ContentNotFound } from '@/components/generic/ContentNotFound';
import { MeetupDetail } from '@/components/pages/MeetupDetail';

export const dynamic = 'force-dynamic';

type MeetupPageProps = {
  params: Promise<{ id: string }>;
};

// Register meet provider (cast needed due to generic type constraints)
contentDetailService.registerProvider(
  'meet',
  meetContentService as ContentDetailProvider
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const result = await contentDetailService.getContentDetail<MeetCustomFields>(
      'meet',
      decodedId
    );

    if (!result.success || !result.content) {
      return {
        title: 'Meetup Not Found',
        description: 'The meetup you are looking for could not be found.',
      };
    }

    const { content } = result;
    const date = new Date(content.customFields.startTime * 1000);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });

    return {
      title: `${content.title} | Meetups`,
      description: content.description || `${content.title} - ${formattedDate} at ${content.customFields.location}`,
      openGraph: {
        title: content.title,
        description: content.description || `Join us at ${content.customFields.location}`,
        images: content.media.length > 0 ? content.media.map(m => ({ url: m.source.url })) : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Meetup | ncoin',
      description: 'View meetup details',
    };
  }
}

export default async function MeetupPage({ params }: MeetupPageProps) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const result = await contentDetailService.getContentDetail<MeetCustomFields>(
      'meet',
      decodedId
    );

    if (!result.success || !result.content) {
      return <ContentNotFound />;
    }

    // Convert ContentDetail to MeetupEvent format for MeetupDetail component
    const { content } = result;
    const meetup = {
      id: content.id,
      dTag: decodedId,
      pubkey: content.author.pubkey,
      name: content.title,
      description: content.description,
      startTime: content.customFields.startTime,
      endTime: content.customFields.endTime,
      timezone: content.customFields.timezone,
      location: content.customFields.location,
      geohash: content.customFields.geohash,
      isVirtual: content.customFields.isVirtual,
      virtualLink: content.customFields.virtualLink,
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
      meetupType: content.customFields.meetupType,
      tags: content.tags,
      hostPubkey: content.customFields.hostPubkey,
      coHosts: content.customFields.coHosts,
      createdAt: content.publishedAt,
      publishedAt: content.publishedAt,
    };

    return (
      <div className="min-h-screen bg-primary-50">
        <div className="container-width py-10">
          <MeetupDetail meetup={meetup} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading meetup:', error);
    return <ContentNotFound />;
  }
}
