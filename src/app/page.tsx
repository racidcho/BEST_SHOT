export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4 text-center">
      <h1 className="text-4xl font-serif font-bold text-stone-800 mb-4">Best Shot</h1>
      <p className="text-stone-600 mb-8 max-w-md">
        조창근 & 도예진 웨딩사진 베스트 컷 선정에 참여해 주셔서 감사합니다.<br />
        전달받으신 <strong>개인 투표 링크</strong>로 접속해 주세요.
      </p>
      <div className="text-sm text-stone-400">
        문의: 조창근
      </div>
    </div>
  );
}
