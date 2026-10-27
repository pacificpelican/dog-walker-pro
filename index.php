<?php
$art = array_map('basename', glob(__DIR__ . '/art/*.{jpg,JPG,jpeg,png,PNG}', GLOB_BRACE) ?: []);
sort($art);
$v = '1';
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#2a1346">
<title>Dog Walker Pro</title>
<link rel="icon" href="assets/logo.svg" type="image/svg+xml">
<link rel="stylesheet" href="css/style.css?v=<?= $v ?>">
</head>
<body>
<div id="app">
  <div id="stage">
    <canvas id="game"></canvas>
    <div id="hud">
      <div id="hud-top">
        <div class="chip" id="pts">★ <b id="pts-v">0</b></div>
        <div class="chip" id="coffee-chip" hidden>☕ <b id="coffee-v"></b></div>
        <div class="chip" id="hat-chip" title="Current hat">🎩 <b id="hat-v">none</b></div>
        <span class="spacer"></span>
        <button class="chip btn" id="btn-map" aria-label="Map">🗺</button>
        <button class="chip btn" id="btn-settings" aria-label="Settings">⚙</button>
      </div>
      <div id="task" hidden>
        <div id="task-title"></div>
        <div class="bar"><i id="bar-dist"></i></div>
        <div id="task-dist"></div>
        <div class="bar calm"><i id="bar-calm"></i></div>
        <div id="task-enc"></div>
        <button id="task-return" class="mini">Return</button>
      </div>
      <canvas id="minimap" width="118" height="72" hidden></canvas>
      <div id="toast"></div>
      <div id="hint"></div>
    </div>
  </div>

  <div id="pad">
    <button id="btn-pause" aria-label="Pause"><span></span><span></span></button>
    <div id="dpad">
      <button data-b="up" aria-label="Up">▲</button>
      <button data-b="left" aria-label="Left">◀</button>
      <button data-b="right" aria-label="Right">▶</button>
      <button data-b="down" aria-label="Down">▼</button>
      <i></i>
    </div>
    <div id="center">
      <img id="logo" src="assets/logo.svg" alt="Dog Walker Pro">
      <div id="player-name">Player 1</div>
      <div id="btn-labels"><span id="lbl-plus">interact</span><span id="lbl-x">hat</span></div>
    </div>
    <div id="abtns">
      <button data-b="plus" class="b green" aria-label="Plus button">+</button>
      <button data-b="x" class="b blue" aria-label="X button">×</button>
      <button data-b="slash" class="b yellow" aria-label="Slash button">/</button>
      <button data-b="minus" class="b red" aria-label="Minus button">−</button>
    </div>
  </div>
</div>

<div id="modal" hidden><div id="modal-card" role="dialog" aria-modal="true"></div></div>

<script>window.DWP = { art: <?= json_encode(array_values($art)) ?> };</script>
<script type="module" src="js/main.js?v=<?= $v ?>"></script>
</body>
</html>
