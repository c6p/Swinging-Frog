import Koji from '@withkoji/vcc';
import 'phaser';
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

new Phaser.Game({
    width: 400,
    height: 400,
    scene: {
        create: function() {
            this.add.text(100, 100, 'hello world', { color: '#ffffff' })
        }
    }
})