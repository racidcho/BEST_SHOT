export interface Participant {
    id: string;
    name: string;
    code: string;
    selected_count: number;
    is_completed: boolean;
    completed_at: string | null;
}

export interface Photo {
    id: number;
    url: string;
    thumbnail_url: string | null;
}

export interface Selection {
    participant_id: string;
    photo_id: number;
    created_at: string;
}
