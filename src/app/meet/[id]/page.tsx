import { Metadata } from 'next';
import { fetchMeetupByDTag } from '@/services/business/MeetService';
import { ContentNotFound } from '@/components/generic/ContentNotFound';
import { MeetupDetail } from '@/components/pages/MeetupDetail';

export const dynamic = 'force-dynamic';

type MeetupPageProps = {
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
    const meetup = await fetchMeetupByDTag('', decodedId);

    if (!meetup) {
      return {
        title: 'Meetup Not Found',
        description: 'The meetup you are looking for could not be found.',
      };
    }

    const date = new Date(meetup.startTime * 1000);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });

    return {
      title: `${meetup.name} | Meetups`,
      description: meetup.description || `${meetup.name} - ${formattedDate} at ${meetup.location}`,
      openGraph: {
        title: meetup.name,
        description: meetup.description || `Join us at ${meetup.location}`,
        images: meetup.media.images.length > 0 ? meetup.media.images.map(img => ({ url: img.url })) : [],
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
    const meetup = await fetchMeetupByDTag('', decodedId);

    if (!meetup) {
      return <ContentNotFound />;
    }

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
