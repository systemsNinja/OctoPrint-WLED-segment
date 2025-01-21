import copy
import logging
import threading
from typing import Dict, Optional

from octoprint.events import Events

import octoprint_wled
from octoprint_wled.util import hex_to_rgb


class PluginEventHandler:
    def __init__(self, plugin):
        self.plugin = plugin  # type: octoprint_wled.WLEDPlugin
        self._logger: logging.Logger = logging.getLogger(
            "octoprint.plugins.wled.events"
        )

        self.event_to_effect: Dict[str, str] = {
            Events.CONNECTED: "idle",
            Events.DISCONNECTED: "disconnected",
            Events.PRINT_STARTED: "started",
            Events.PRINT_FAILED: "failed",
            Events.PRINT_DONE: "success",
            Events.PRINT_PAUSED: "paused",
        }

        self.last_event: Optional[str] = None
        self._return_to_idle: Optional[threading.Timer] = None

    def on_event(self, event, payload) -> None:
        # noinspection PyProtectedMember
        if event == Events.PRINT_STARTED:
            self.plugin.cooling = False

        if event == Events.PRINT_DONE and self.plugin._settings.get_boolean(
            ["progress", "cooling", "enabled"]
        ):
            self.plugin.cooling = True

        elif event in self.event_to_effect.keys():
            self.last_event = event
            if self._return_to_idle and self._return_to_idle.is_alive():
                self._return_to_idle.cancel()

            # This is async, no need for threading
            self.update_effect(effect=self.event_to_effect[event])

        # Start 'return to idle' timer if neccessary
        if event == Events.PRINT_DONE:
            # noinspection PyProtectedMember
            idle_timeout = self.plugin._settings.get_int(["features", "return_to_idle"])
            if idle_timeout > 0:
                if self._return_to_idle and self._return_to_idle.is_alive():
                    self._return_to_idle.cancel()

                self._return_to_idle = threading.Timer(
                    idle_timeout, self.update_effect, kwargs={"effect": "idle"}
                )
                self._return_to_idle.start()

    def update_effect(self, effect) -> None:
        """
        Updates the effect running on the specified segment in WLED
        :param effect: name of the effect to run, internal identifier (not WLED)
        :return: None
        """
        # Check WLED is setup & ready
        if not self.plugin.wled:
            return

        # Grab the settings
        # noinspection PyProtectedMember
        effect_enabled = self.plugin._settings.get_boolean(
            ["effects", effect, "enabled"]
        )
        # noinspection PyProtectedMember
        effect_settings = self.plugin._settings.get(["effects", effect, "settings"])
        lights_on = copy.copy(self.plugin.lights_on)
        turn_lights_on = False

        if not effect_enabled:
            self._logger.debug("Effect not enabled, not running")
            return

        if not effect_settings:
            self._logger.warning(
                "Effect enabled but no settings could be found, check config"
            )
            return

        # Loop through segments, set the brightness, report any problems
        for segment in effect_settings:
            if segment["override_on"]:
                turn_lights_on = True

            self._logger.debug(
                f"setting {segment['effect']} to segment {segment['id']}"
            )

            # Set the effect on WLED
            self.plugin.runner.wled_call(
                self.plugin.wled.segment,
                kwargs={
                    "segment_id": int(segment["id"]),
                    "brightness": int(segment["brightness"]),
                    "color_primary": hex_to_rgb(segment["color_primary"]),
                    "color_secondary": hex_to_rgb(segment["color_secondary"]),
                    "color_tertiary": hex_to_rgb(segment["color_tertiary"]),
                    "effect": segment["effect"],
                    "intensity": int(segment["intensity"]),
                    "speed": int(segment["speed"]),
                    "on": lights_on,
                },
            )

        if turn_lights_on:
            self.plugin.activate_lights()

    def restart(self) -> None:
        """
        Process the last event again, called when settings are changed
        :return: None
        """
        self.on_event(self.last_event, {})
