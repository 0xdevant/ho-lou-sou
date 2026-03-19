interface Props {
  onBack: () => void;
}

export default function PrivacyPage({ onBack }: Props) {
  return (
    <div className="min-h-screen max-w-2xl mx-auto pb-8">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="text-brand font-medium text-sm">← 返回</button>
          <h1 className="text-lg font-bold text-text">私隱政策</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 text-sm text-text leading-relaxed">
        <p className="text-text-muted">最後更新：2026 年 3 月</p>

        <section>
          <h2 className="font-bold text-base mb-2">概要</h2>
          <p>
            好路數（「本網站」）尊重你嘅私隱。本私隱政策說明我哋點樣收集、使用同保護你嘅資料。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">我哋收集咩資料</h2>
          <p>本網站唔會要求你註冊或者提供任何個人資料。我哋可能透過以下方式收集有限嘅非個人資料：</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>使用數據</strong> — 瀏覽頁面、使用時間等匿名統計數據</li>
            <li><strong>Cookies</strong> — 用於網站分析同廣告服務（如適用）</li>
            <li><strong>裝置資料</strong> — 瀏覽器類型、螢幕解像度等技術資料</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Cookies</h2>
          <p>
            本網站可能使用 Cookies 或類似技術嚟改善用戶體驗同進行網站分析。你可以透過瀏覽器設定管理或者停用 Cookies。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">第三方服務</h2>
          <p>本網站可能使用以下第三方服務：</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Cloudflare</strong> — 用於網站託管同內容傳遞</li>
          </ul>
          <p className="mt-2">呢啲第三方服務有各自嘅私隱政策，建議你查閱相關條款。</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">外部連結</h2>
          <p>
            本網站包含前往第三方網站嘅連結（例如優惠詳情頁面）。我哋對呢啲外部網站嘅內容同私隱做法概不負責。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">資料安全</h2>
          <p>
            本網站透過 Cloudflare 提供 HTTPS 加密連接，確保你嘅瀏覽活動受到保護。我哋唔會儲存任何個人身份資料。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">政策更新</h2>
          <p>
            我哋可能會不時更新本私隱政策。任何更改都會喺本頁面公布，並更新上方嘅「最後更新」日期。
          </p>
        </section>
      </main>
    </div>
  );
}
