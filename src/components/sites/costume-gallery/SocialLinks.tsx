const GITHUB_URL = "https://github.com/GodAI-Master/ai-reference-atlas-zh";
const DOUYIN_NAME = "甲方之外";
const DOUYIN_ID = "BeyondPartyA";
const DOUYIN_URL = "https://v.douyin.com/SpMqdao0Fl0/";
const QR_SRC = "/sites/costume-gallery/douyin-qr.png";

export default function SocialLinks() {
  return (
    <div className="infotabs social">
      <a
        className="itab schip"
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="GitHub 仓库"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
        </svg>
        GitHub
      </a>

      <div className="qr-wrap">
        <a
          className="itab schip"
          href={DOUYIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={`${DOUYIN_NAME} · 抖音号 ${DOUYIN_ID}`}
          aria-label={`抖音：${DOUYIN_NAME}，抖音号 ${DOUYIN_ID}，点击进入主页`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12.5 2h2.6c.3 1.6 1.4 2.9 3 3.3v2.7c-1.2-.1-2.4-.5-3.4-1.2v6.1c0 3.2-2.6 5.8-5.8 5.8S3 16.1 3 12.9s2.6-5.8 5.8-5.8c.3 0 .6 0 .9.1v2.8c-.3-.1-.6-.2-.9-.2-1.7 0-3.1 1.4-3.1 3.1s1.4 3.1 3.1 3.1 3.1-1.4 3.1-3.1V2z" />
          </svg>
          抖音
        </a>

        <div className="qr-pop" role="tooltip">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={QR_SRC}
            alt={`${DOUYIN_NAME}的抖音二维码`}
            width={480}
            height={480}
          />
          <strong>{DOUYIN_NAME}</strong>
          <span>抖音号 {DOUYIN_ID}</span>
          <span className="qr-hint">扫码关注 · 点击进入主页</span>
        </div>
      </div>
    </div>
  );
}
