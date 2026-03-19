interface Props {
  onBack: () => void;
  onContact: () => void;
}

export default function DisclaimerPage({ onBack, onContact }: Props) {
  return (
    <div className="min-h-screen max-w-2xl mx-auto pb-8">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="text-brand font-medium text-sm">← 返回</button>
          <h1 className="text-lg font-bold text-text">免責聲明</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 text-sm text-text leading-relaxed">
        <section>
          <h2 className="font-bold text-base mb-2">資料來源與版權</h2>
          <p>
            本網站（好路數）為一個優惠資訊聚合平台，所有優惠內容及相關商標均屬於其各自擁有者及原始發佈網站所有。本網站僅提供資訊摘要及直接連結返原始來源，所有優惠詳情以商戶官方公佈為準。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">非商業合作關係</h2>
          <p>
            本網站與所展示嘅任何品牌、商戶或優惠網站均無正式商業合作關係。所有資料只作參考用途，不構成任何購買建議或推薦。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">資料準確性</h2>
          <p>
            雖然我哋盡力確保所顯示嘅優惠資料準確同最新，但由於資料經自動化程式收集，可能出現延誤、遺漏或錯誤。用戶喺使用任何優惠前，請自行向相關商戶確認優惠條款及有效期。本網站對因使用本站資料而造成嘅任何損失概不負責。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">反向連結</h2>
          <p>
            本網站所有優惠資訊均附有返回原始來源嘅直接連結，目的係為用戶提供便利之餘，亦為原始網站帶來流量。我哋尊重所有內容擁有者嘅權益。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">內容移除</h2>
          <p>
            如果你係任何展示內容嘅版權擁有者，並希望我哋移除相關資料，請透過<button onClick={onContact} className="text-brand underline mx-1">聯絡表格</button>通知我哋，我哋會盡快處理。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">外部連結</h2>
          <p>
            本網站包含前往第三方網站嘅連結。我哋對呢啲外部網站嘅內容、私隱政策或做法概不負責。點擊外部連結後嘅行為由用戶自行承擔。
          </p>
        </section>
      </main>
    </div>
  );
}
