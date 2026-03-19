interface Props {
  onBack: () => void;
  onContact: () => void;
}

export default function AboutPage({ onBack, onContact }: Props) {
  return (
    <div className="min-h-screen max-w-2xl mx-auto pb-8">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="text-brand font-medium text-sm">← 返回</button>
          <h1 className="text-lg font-bold text-text">關於好路數</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 text-sm text-text leading-relaxed">
        <section>
          <h2 className="font-bold text-base mb-2">好路數係咩嚟？</h2>
          <p>
            好路數係一個專為香港人而設嘅著數優惠聚合平台。我哋每日自動從多個熱門優惠網站收集最新嘅折扣資訊，幫你一眼睇晒全港最抵嘅著數，唔使再逐個網站去睇。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">我哋涵蓋啲咩？</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>飲食</strong> — 自助餐、餐廳優惠、外賣折扣</li>
            <li><strong>服飾購物</strong> — 服飾、美容、百貨公司、開倉</li>
            <li><strong>住宿酒店</strong> — Staycation、酒店優惠</li>
            <li><strong>機票旅遊</strong> — 平機票、旅遊套票</li>
            <li><strong>超市便利店</strong> — 超市同便利店著數</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">資料來源</h2>
          <p>
            我哋嘅優惠資料來自多個可靠嘅香港優惠網站，包括 Jetso Club、Klook、Kongsolo、RunHotel、Jetso Today 等等。所有資料每日自動更新，確保你睇到嘅都係最新嘅著數。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">點解揀好路數？</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>全自動每日更新，唔使自己去搵</li>
            <li>分類清晰，想搵咩一撳即到</li>
            <li>支援品牌篩選同關鍵字搜尋</li>
            <li>介面簡潔，載入快速</li>
            <li>專注香港本地著數，過濾咗無關資訊</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">技術架構</h2>
          <p>
            好路數由 Cloudflare Workers 驅動，使用 Cloudflare D1 數據庫儲存資料，前端部署喺 Cloudflare Pages。每日透過定時任務自動抓取同更新最新著數。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">聯絡我哋</h2>
          <p>
            如果你有任何建議或者想推薦新嘅優惠來源，歡迎透過<button onClick={onContact} className="text-brand underline mx-1">聯絡表格</button>聯絡我哋。
          </p>
        </section>
      </main>
    </div>
  );
}
