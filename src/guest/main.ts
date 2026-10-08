import './styles/tokens.css';
import './styles/base.css';
import './styles/cover.css';
import './styles/sections.css';
import './styles/fx.css';
import { bootstrap } from './bootstrap';

void bootstrap();

// dev: admin (DevServerAdapter) vừa ghi public/content -> tải lại trang khách (không áp dụng cho khung preview)
if (import.meta.hot) {
  import.meta.hot.on('wp:content-changed', () => {
    if (!new URLSearchParams(location.search).has('preview')) location.reload();
  });
}
