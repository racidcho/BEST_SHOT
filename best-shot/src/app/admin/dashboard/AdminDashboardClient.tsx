'use client';

import { Participant, Photo, Selection } from '@/types';
import { supabase } from '@/lib/supabase';
import { useState, useRef } from 'react';
import { RefreshCw, FileDown, Loader2, RotateCcw } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function AdminDashboardClient({ initialParticipants }: { initialParticipants: Participant[] }) {
    const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const pdfRef = useRef<HTMLDivElement>(null);
    const [pdfData, setPdfData] = useState<{ topPhotos: (Photo & { count: number })[], participants: Participant[] } | null>(null);

    const fetchParticipants = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('participants')
            .select('*')
            .order('created_at', { ascending: true });

        if (data) {
            setParticipants(data);
        }
        setIsLoading(false);
    };

    const resetParticipant = async (participantId: string, participantName: string) => {
        if (!confirm(`${participantName} 님의 투표 기록을 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

        try {
            setIsLoading(true);

            // 1. Delete selections
            const { error: deleteError } = await supabase
                .from('selections')
                .delete()
                .eq('participant_id', participantId);

            if (deleteError) throw deleteError;

            // 2. Reset participant status
            const { error: updateError } = await supabase
                .from('participants')
                .update({
                    selected_count: 0,
                    is_completed: false,
                    completed_at: null
                })
                .eq('id', participantId);

            if (updateError) throw updateError;

            alert('초기화되었습니다.');
            await fetchParticipants();

        } catch (error) {
            console.error('Error resetting participant:', error);
            alert('초기화 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const generatePDF = async () => {
        setIsGeneratingPdf(true);
        try {
            // 1. Fetch all necessary data
            const [photosRes, selectionsRes] = await Promise.all([
                supabase.from('photos').select('*'),
                supabase.from('selections').select('*')
            ]);

            if (!photosRes.data || !selectionsRes.data) throw new Error('Failed to fetch data');

            const photos = photosRes.data as Photo[];
            const selections = selectionsRes.data as Selection[];

            // 2. Calculate stats
            const photoCounts = selections.reduce((acc, curr) => {
                acc[curr.photo_id] = (acc[curr.photo_id] || 0) + 1;
                return acc;
            }, {} as Record<number, number>);

            const topPhotos = photos
                .map(p => ({ ...p, count: photoCounts[p.id] || 0 }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10); // Top 10

            setPdfData({ topPhotos, participants });

            // Wait for render - increased time and ensure images load
            await new Promise(resolve => setTimeout(resolve, 2000));

            if (!pdfRef.current) return;

            // 3. Capture and generate PDF page by page
            const pages = pdfRef.current.querySelectorAll('.pdf-page');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i] as HTMLElement;
                const canvas = await html2canvas(page, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                });

                const imgData = canvas.toDataURL('image/png');

                // Add image to current page
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

                // Add new page if not the last one
                if (i < pages.length - 1) {
                    pdf.addPage();
                }
            }

            pdf.save('BestShot_Result.pdf');

        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert(`PDF 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsGeneratingPdf(false);
            setPdfData(null); // Hide the hidden div
        }
    };

    const getStatusBadge = (p: Participant) => {
        if (p.is_completed) return <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-medium">완료</span>;
        if (p.selected_count > 0) return <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-medium">진행중</span>;
        return <span className="px-2 py-1 rounded bg-stone-100 text-stone-500 text-xs font-medium">미시작</span>;
    };

    // Helper to chunk array
    const chunk = <T,>(arr: T[], size: number) => {
        return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
            arr.slice(i * size, i * size + size)
        );
    };

    return (
        <div className="min-h-screen bg-stone-50 p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-serif font-bold text-stone-800">관리자 대시보드</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchParticipants}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors"
                        >
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            새로고침
                        </button>
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
                            onClick={generatePDF}
                            disabled={isGeneratingPdf}
                        >
                            {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                            결과 PDF 다운로드
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="px-6 py-4 text-sm font-medium text-stone-500">참가자</th>
                                <th className="px-6 py-4 text-sm font-medium text-stone-500">상태</th>
                                <th className="px-6 py-4 text-sm font-medium text-stone-500">선택 현황</th>
                                <th className="px-6 py-4 text-sm font-medium text-stone-500">완료 시간</th>
                                <th className="px-6 py-4 text-sm font-medium text-stone-500">링크</th>
                                <th className="px-6 py-4 text-sm font-medium text-stone-500">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {participants.map((p) => (
                                <tr key={p.id} className="hover:bg-stone-50/50">
                                    <td className="px-6 py-4 font-medium text-stone-800">{p.name.replace(/ ?님$/, '')} 님</td>
                                    <td className="px-6 py-4">{getStatusBadge(p)}</td>
                                    <td className="px-6 py-4 text-stone-600">{p.selected_count} / 10</td>
                                    <td className="px-6 py-4 text-stone-400 text-sm">
                                        {p.completed_at ? new Date(p.completed_at).toLocaleString('ko-KR') : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <a
                                            href={`/vote/${p.code}`}
                                            target="_blank"
                                            className="text-rose-500 hover:underline text-sm"
                                        >
                                            {p.code}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => resetParticipant(p.id, p.name)}
                                            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            title="초기화"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hidden PDF Template - Rendered as distinct pages */}
            {pdfData && (
                <div
                    className="fixed top-0 left-0 z-[-1] pointer-events-none"
                    ref={pdfRef}
                >
                    {/* Page 1: Title & Participants */}
                    <div className="pdf-page w-[210mm] h-[297mm] p-8 flex flex-col relative" style={{ backgroundColor: '#ffffff' }}>
                        <div className="text-center border-b pb-6 mb-6" style={{ borderColor: '#e7e5e4' }}>
                            <h1 className="text-4xl font-serif font-bold mb-2" style={{ color: '#292524' }}>Best Shot Result</h1>
                            <p style={{ color: '#78716c' }}>조창근 & 도예진 웨딩사진 베스트 10</p>
                            <p className="text-sm mt-2" style={{ color: '#a8a29e' }}>{new Date().toLocaleDateString('ko-KR')}</p>
                        </div>

                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-4" style={{ color: '#292524' }}>📋 참가자 현황</h2>
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="border-b" style={{ borderColor: '#d6d3d1' }}>
                                        <th className="py-3" style={{ color: '#000000' }}>이름</th>
                                        <th className="py-3" style={{ color: '#000000' }}>상태</th>
                                        <th className="py-3" style={{ color: '#000000' }}>완료 시간</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pdfData.participants.map(p => (
                                        <tr key={p.id} className="border-b" style={{ borderColor: '#f5f5f4' }}>
                                            <td className="py-3" style={{ color: '#292524' }}>{p.name.replace(/ ?님$/, '')} 님</td>
                                            <td className="py-3" style={{ color: '#292524' }}>{p.is_completed ? '완료' : '진행중'}</td>
                                            <td className="py-3" style={{ color: '#57534e' }}>{p.completed_at ? new Date(p.completed_at).toLocaleString('ko-KR') : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="text-center text-xs mt-auto" style={{ color: '#a8a29e' }}>
                            Page 1 / {Math.ceil(pdfData.topPhotos.length / 4) + 1}
                        </div>
                    </div>

                    {/* Photo Pages: 4 photos per page */}
                    {chunk(pdfData.topPhotos, 4).map((photoChunk, pageIdx) => (
                        <div key={pageIdx} className="pdf-page w-[210mm] h-[297mm] p-8 flex flex-col relative" style={{ backgroundColor: '#ffffff' }}>
                            <h2 className="text-2xl font-bold mb-4" style={{ color: '#292524' }}>
                                🏆 Top 10 Photos ({pageIdx * 4 + 1} ~ {Math.min((pageIdx + 1) * 4, 10)})
                            </h2>

                            <div className="grid grid-cols-2 gap-6 flex-1 content-start">
                                {photoChunk.map((photo, idx) => (
                                    <div key={photo.id} className="text-center">
                                        <div
                                            className="relative aspect-[2/3] rounded-xl overflow-hidden border-2 mb-2 shadow-sm flex items-center justify-center"
                                            style={{ borderColor: '#e7e5e4', backgroundColor: '#fafaf9' }}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={photo.thumbnail_url || photo.url}
                                                alt=""
                                                className="max-w-full max-h-full w-auto h-auto"
                                                style={{ objectFit: 'contain' }}
                                                crossOrigin="anonymous"
                                            />
                                            <div
                                                className="absolute top-0 left-0 w-12 h-12 flex items-center justify-center text-xl font-bold"
                                                style={{ backgroundColor: '#f43f5e', color: '#ffffff' }}
                                            >
                                                {pageIdx * 4 + idx + 1}
                                            </div>
                                        </div>
                                        <p className="font-bold text-3xl mb-1" style={{ color: '#000000' }}>{photo.count}표</p>
                                        <p className="text-lg font-medium" style={{ color: '#78716c' }}>사진 #{photo.id}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center text-xs mt-auto" style={{ color: '#a8a29e' }}>
                                Page {pageIdx + 2} / {Math.ceil(pdfData.topPhotos.length / 4) + 1}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
