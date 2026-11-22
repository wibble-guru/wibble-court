import '@wibble-guru/boilerplate/base.css';
import { WibbleFrame } from '@wibble-guru/boilerplate';
import { render } from 'preact';
import { App } from '@/App';
import { game } from '@/wibble';
import '@/styles/index.css';

render(
  <WibbleFrame
    game={game}
    connecting={
      <main className="stage">
        <p className="hint">사이트와 연결하는 중…</p>
      </main>
    }
  >
    {() => <App />}
  </WibbleFrame>,
  document.getElementById('root')!,
);
