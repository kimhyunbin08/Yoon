import type { Metadata } from "next";

export const metadata: Metadata = { title: "개인정보처리방침 · StillRoom" };

// Privacy policy linked from the Google OAuth branding page (SPEC §3.2, D21).
export default function Privacy() {
  return (
    // body is overflow:hidden for the room, so this page scrolls itself
    <main className="h-full overflow-y-auto">
      <article className="mx-auto max-w-[40rem] px-6 py-12 leading-relaxed">
        <h1 className="mb-2 text-2xl font-semibold">개인정보처리방침</h1>
        <p className="mb-8 text-sm text-muted">StillRoom · 2026년 10월 14일 시행</p>

        <h2 className="mb-2 mt-6 font-semibold">무엇을 저장하나요</h2>
        <p>
          공부 기록, 조각, 방 꾸미기, 할 일은 모두 사용자의 브라우저(IndexedDB)에만 저장됩니다. StillRoom에는 계정도, 데이터베이스도
          없습니다.
        </p>

        <h2 className="mb-2 mt-6 font-semibold">Google 캘린더 연결 (선택)</h2>
        <ul className="list-disc pl-5">
          <li>캘린더 목록과 오늘 일정을 <strong>읽기만</strong> 합니다. 일정을 만들거나 고치거나 지우지 않습니다.</li>
          <li>받아온 일정과 연결 토큰은 사용자의 브라우저에만 저장됩니다.</li>
          <li>
            토큰을 새로 받을 때만 StillRoom 서버 함수를 거쳐 Google에 요청합니다. 이 함수는 아무것도 저장하거나 기록하지 않습니다.
          </li>
          <li>Google 사용자 데이터를 다른 곳에 보내거나, 팔거나, 광고에 쓰지 않습니다.</li>
        </ul>

        <h2 className="mb-2 mt-6 font-semibold">연결 끊기와 삭제</h2>
        <p>
          할 일 패널의 &ldquo;연결 끊기&rdquo;를 누르면 Google 권한을 취소하고 브라우저에 저장된 일정과 토큰을 지웁니다. Google 계정의
          &ldquo;서드파티 앱 및 서비스&rdquo;에서도 언제든 취소할 수 있습니다. 브라우저의 사이트 데이터를 지우면 모든 기록이 삭제됩니다.
        </p>

        <h2 className="mb-2 mt-6 font-semibold">문의</h2>
        <p>
          <a className="underline" href="https://github.com/kimhyunbin08/Yoon/issues">
            github.com/kimhyunbin08/Yoon/issues
          </a>
        </p>
      </article>
    </main>
  );
}
