import Koji from '@withkoji/vcc';

export const CONFIG = {
	WIDTH: 600,
	HEIGHT: 1080,
	UI_ICON_SIZE: 48,
	UI_ICON_PADDING: 8,
	SCENE_TRANSITION_TIME: Koji.config.strings.scene_transition_time,
	MAX_ROPE_LENGTH: Koji.config.strings.max_rope_length,
	ROPE_COLOR: Koji.config.colors.rope_color.replace("#", "0x"),
	BOUNCE_FACTOR: Koji.config.strings.platform_bounce,
	GAME_SPEED: 1,
	MAX_SPEED: 20,
  BASE_BOUNCE_SPEED: 8,
  ROPE_JUMP_SPEED: 4,
};