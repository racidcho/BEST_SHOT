import { supabase } from '@/lib/supabase';
import VoteClient from './VoteClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ code: string }>;
}

export default async function VotePage({ params }: PageProps) {
    const { code } = await params;

    // Fetch participant
    const { data: participant, error: pError } = await supabase
        .from('participants')
        .select('*')
        .eq('code', code)
        .single();

    if (pError || !participant) {
        return notFound();
    }

    // Fetch photos
    const { data: photos, error: phError } = await supabase
        .from('photos')
        .select('*')
        .order('id', { ascending: true });

    if (phError || !photos) {
        return <div>Error loading photos</div>;
    }

    // If completed, show result view (Simple version for now)
    if (participant.is_completed) {
        // Fetch selections
        const { data: selections } = await supabase
            .from('selections')
            .select('photo_id')
            .eq('participant_id', participant.id);

        const selectedPhotoIds = selections?.map(s => s.photo_id) || [];
        const selectedPhotos = photos.filter(p => selectedPhotoIds.includes(p.id));

        return (
            <div className="min-h-screen bg-stone-50 p-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 mb-8">
                        <h1 className="text-3xl font-serif text-stone-800 mb-4">투표가 완료되었습니다!</h1>
                        <p className="text-stone-600 mb-6">
                            {participant.name.replace(/ ?님$/, '')} 님, 참여해 주셔서 감사합니다.<br />
                            선택하신 10장의 사진은 다음과 같습니다.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {selectedPhotos.map(photo => (
                                <div key={photo.id} className="relative aspect-[3/4] rounded-lg overflow-hidden">
                                    <img
                                        src={photo.thumbnail_url || photo.url}
                                        alt={`Selected ${photo.id}`}
                                        className="object-cover w-full h-full"
                                    />
                                    <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                                        #{photo.id}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="text-stone-400 text-sm">Best Shot by 조창근 & 도예진</p>
                </div>
            </div>
        );
    }

    return <VoteClient participant={participant} photos={photos} />;
}
