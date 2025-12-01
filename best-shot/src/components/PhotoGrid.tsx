'use client';

import Image from 'next/image';
import { Check, ZoomIn, X, Heart } from 'lucide-react';
import { Photo } from '@/types';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';

interface PhotoGridProps {
    photos: Photo[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    disabled?: boolean;
    globalSelections?: Record<number, string[]>;
}

export default function PhotoGrid({ photos, selectedIds, onToggle, disabled, globalSelections = {} }: PhotoGridProps) {
    const [zoomedPhoto, setZoomedPhoto] = useState<Photo | null>(null);

    const isSelected = (id: number) => selectedIds.includes(id);
    const isMaxReached = selectedIds.length >= 10;

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (zoomedPhoto) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [zoomedPhoto]);

    const getVoters = (photoId: number) => globalSelections[photoId] || [];

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3 pb-24">
                {photos.map((photo) => {
                    const selected = isSelected(photo.id);
                    const isItemDisabled = disabled || (!selected && isMaxReached);
                    const voters = getVoters(photo.id);
                    const voteCount = voters.length;

                    return (
                        <div
                            key={photo.id}
                            className={clsx(
                                'relative aspect-[3/4] rounded-lg overflow-hidden transition-all duration-300 shadow-sm border border-stone-100',
                                selected ? 'ring-2 ring-rose-500' : ''
                            )}
                        >
                            {/* Image Area - Click to Zoom */}
                            <div
                                className="absolute inset-0 cursor-zoom-in"
                                onClick={() => setZoomedPhoto(photo)}
                            >
                                <Image
                                    src={photo.thumbnail_url || photo.url}
                                    alt={`Photo ${photo.id}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                                />

                                {/* Zoom Indicator (Subtle) */}
                                <div className="absolute top-2 right-2 bg-black/20 text-white p-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ZoomIn size={14} />
                                </div>
                            </div>

                            {/* Selection Button (Overlay) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isItemDisabled || selected) {
                                        onToggle(photo.id);
                                    }
                                }}
                                disabled={isItemDisabled && !selected}
                                className={clsx(
                                    'absolute bottom-2 right-2 p-2 rounded-full shadow-lg transition-all active:scale-90 z-10',
                                    selected
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-white/90 text-stone-400 hover:text-rose-500 hover:bg-white',
                                    isItemDisabled && !selected && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                {selected ? <Check size={18} strokeWidth={3} /> : <Heart size={18} />}
                            </button>

                            {/* ID Badge */}
                            <div className="absolute top-2 left-2 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                #{photo.id}
                            </div>

                            {/* Global Vote Count Badge */}
                            {voteCount > 0 && (
                                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                                    <Heart size={10} className="fill-rose-500 text-rose-500" />
                                    <span>{voteCount}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Zoom Modal */}
            {zoomedPhoto && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-fade-in"
                    onClick={() => setZoomedPhoto(null)}
                >
                    {/* Close Button */}
                    <button
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-[102]"
                        onClick={() => setZoomedPhoto(null)}
                    >
                        <X size={32} />
                    </button>

                    {/* Voters List (Top Left) */}
                    {getVoters(zoomedPhoto.id).length > 0 && (
                        <div className="absolute top-4 left-4 z-[102] max-w-[200px] sm:max-w-xs">
                            <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 text-white/90 text-sm border border-white/10">
                                <div className="flex items-center gap-2 mb-1 text-rose-400 font-bold">
                                    <Heart size={14} className="fill-rose-500" />
                                    <span>{getVoters(zoomedPhoto.id).length}명이 선택함</span>
                                </div>
                                <div className="leading-relaxed text-xs opacity-90 break-keep">
                                    {getVoters(zoomedPhoto.id).map(name => name.replace(/ ?님$/, '')).join(', ')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Image */}
                    <div className="relative w-full h-full max-w-4xl max-h-[80vh] m-4">
                        <Image
                            src={zoomedPhoto.url}
                            alt={`Photo ${zoomedPhoto.id}`}
                            fill
                            className="object-contain"
                            priority
                            sizes="100vw"
                        />
                    </div>

                    {/* Bottom Action Bar */}
                    <div
                        className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-end pb-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => onToggle(zoomedPhoto.id)}
                            disabled={disabled || (!isSelected(zoomedPhoto.id) && isMaxReached)}
                            className={clsx(
                                'flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg shadow-xl transition-all active:scale-95',
                                isSelected(zoomedPhoto.id)
                                    ? 'bg-rose-500 text-white ring-4 ring-rose-500/30'
                                    : 'bg-white text-stone-800 hover:bg-stone-100'
                            )}
                        >
                            {isSelected(zoomedPhoto.id) ? (
                                <>
                                    <Check size={24} strokeWidth={3} />
                                    선택됨
                                </>
                            ) : (
                                <>
                                    <Heart size={24} />
                                    이 사진 선택하기
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
