import Koji from '@withkoji/vcc';
import './styles.css';

// render app
const render = () => {
    document.body.innerHTML = `
        <h1>
            ${Koji.config.settings.name}
        </h1>
    `
};

// render
render();