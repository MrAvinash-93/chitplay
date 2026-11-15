    draw(view, ctx, game) {
      if (slug === 'ludo') {
        const me = Number.isInteger(ctx.me) && ctx.me >= 0 ? ctx.me : 0;
        const q = ludoQuarter(view, me);
        // Keep each player's own corner at the lower-left of their screen. Seat 3 is already there,
        // and every other seat rotates the board so the local player's home corner lands there.
        st.world.rotation.y = ((3 - q) % 4) * (Math.PI / 2);
      } else {
        st.world.rotation.y = def.faces && ctx.me === 1 ? Math.PI : 0;
      }
      const seatOf = ctxHelpers.seatOf;
      if (def.chit) {
        st.begin();
        chitDraw(st, game.chit ? game.chit(view) : { text: 'ChitPlay', label: '' });
        st.end();
        return;
      }
      if (slug === 'carrom') { def.draw(st, view, ctx); return; }
      st.begin();
      if (def.tray) drawTray(st, def, view, ctx);
      else def.draw.call(def, st, view, ctx, seatOf);
      st.end();
    },