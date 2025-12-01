-- 1. 모든 선택 내역 삭제 (Delete all selections)
DELETE FROM public.selections;

-- 2. 참가자 상태 초기화 (Reset participant status)
UPDATE public.participants
SET 
  selected_count = 0,
  is_completed = false,
  completed_at = NULL;
