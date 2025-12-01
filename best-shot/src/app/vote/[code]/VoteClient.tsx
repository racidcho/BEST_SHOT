'use client';

import { useState, useEffect } from 'react';
import { Participant, Photo } from '@/types';
import PhotoGrid from '@/components/PhotoGrid';
import { supabase } from '@/lib/supabase';
import { Loader2, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VoteClientProps {
    participant: Participant;
    photos: Photo[];
}

export default function VoteClient({ participant, photos }: VoteClientProps) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Map: photoId -> Array of voter names
    const [globalSelections, setGlobalSelections] = useState<Record<number, string[]>>({});
    const router = useRouter();

    // Fetch initial global selections and subscribe to changes
    useEffect(() => {
        const fetchGlobalSelections = async () => {
            const { data, error } = await supabase
                .from('selections')
                .select('photo_id, participants(name)');

            if (error) {
                console.error('Error fetching global selections:', error);
                return;
            }

            // Process data into a map
            const newSelections: Record<number, string[]> = {};
            data.forEach((item: any) => {
                const pid = item.photo_id;
                const name = item.participants?.name;
                if (pid && name) {
                    if (!newSelections[pid]) newSelections[pid] = [];
                    newSelections[pid].push(name);
                }
            });
            setGlobalSelections(newSelections);
        };

        fetchGlobalSelections();

        // Realtime Subscription
        const channel = supabase
            .channel('public:selections')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'selections' },
                () => {
                    // On any change (Insert/Delete), just re-fetch the whole list for simplicity and accuracy
                    fetchGlobalSelections();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleToggle = (id: number) => {
        if (isSubmitting) return;

        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(pid => pid !== id));
        } else {
            if (selectedIds.length < 10) {
                setSelectedIds(prev => [...prev, id]);
            }
        }
    };

    const handleSubmit = async () => {
        if (selectedIds.length !== 10) return;
        if (!confirm('정말 이 10장으로 결정하시겠습니까? 제출 후에는 수정할 수 없습니다.')) return;

        setIsSubmitting(true);

        try {
            // 1. Insert selections
            const selections = selectedIds.map(photoId => ({
                participant_id: participant.id,
                photo_id: photoId
            }));

            const { error: selectionError } = await supabase
                .from('selections')
                .insert(selections);

            if (selectionError) throw selectionError;

            // 2. Update participant status
            const { error: updateError } = await supabase
                .from('participants')
                .update({
                    selected_count: 10,
                    is_completed: true,
                    completed_at: new Date().toISOString()
                })
                .eq('id', participant.id);

            if (updateError) throw updateError;

            alert('투표가 완료되었습니다! 감사합니다.');
            router.refresh();
        } catch (error) {
            console.error('Error submitting vote:', error);
            alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-serif font-bold text-stone-800">Best Shot</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-stone-600 hidden sm:inline">
                            {participant.name.replace(/ ?님$/, '')} 님
                        </span>
                        <div className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedIds.length === 10
                            ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
                            : 'bg-stone-100 text-stone-600'
                            }`}>
                            {selectedIds.length} / 10 선택
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6">
                <div className="px-4 mb-6">
                    <h2 className="text-2xl font-serif text-stone-800 mb-2">
                        가장 마음에 드는 사진 10장을 골라주세요
                    </h2>
                    <p className="text-stone-500">
                        다른 분들이 어떤 사진을 선택했는지 실시간으로 확인할 수 있습니다.
                    </p>
                </div>

                <PhotoGrid
                    photos={photos}
                    selectedIds={selectedIds}
                    onToggle={handleToggle}
                    disabled={isSubmitting}
                    globalSelections={globalSelections}
                />
            </main>

            {/* Floating Submit Button */}
            <div className={`fixed bottom-6 left-0 right-0 flex justify-center transition-transform duration-300 ${selectedIds.length === 10 ? 'translate-y-0' : 'translate-y-24'
                }`}>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || selectedIds.length !== 10}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-full shadow-xl flex items-center gap-2 font-medium text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" />
                            제출 중...
                        </>
                    ) : (
                        <>
                            <Send size={20} />
                            선택 완료하기
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
