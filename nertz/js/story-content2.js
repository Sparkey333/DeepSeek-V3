/* story-content2.js — Chapter 2: "The Undertow".
 * The dark turn of the saga (see STORY_BIBLE.md): the club is reopened, but
 * the town's luck was gambled away long ago, and something gray has noticed
 * the lights back on. Merged into the campaign by story.js.
 */
(function (g) {
  "use strict";
  const Nertz = (g.Nertz = g.Nertz || {});

  Nertz.storyContent2 = {
    chapters: {
      2: { title: "Chapter 2 — The Undertow", sub: "The lights are back on. Something in the water noticed." },
    },

    cast: {
      collector: { name: "The Collector", emoji: "🕴️" },
      grayd: { name: "A Gray Voice", emoji: "🌫️" },
    },

    locations: [],

    beats: [
      {
        id: "c2b1", locationId: "club", type: "dialogue", title: "The Water Feature Rises",
        intro: [
          { who: "gus", text: "(whispering, somehow louder than shouting) FOLKS. THE WATER FEATURE. IT'S... GLOWING." },
          { who: "doreen", text: "Chowder don't glow, and I'd know. I've made some experimental chowder." },
          { who: "crumbs", text: "( lands. places one card down. maintains eye contact. )" },
          { who: "betts", text: "That's an ace with no suit, kid. Gray as a gull's grudge. In fifty years I've seen exactly one other." },
          { who: "betts", text: "A wise sailor once said: when the sea sends you a bill... hm. When the tide mails you... look, we owe somebody something." },
          { who: "milo", text: "Statistically, glowing floods precede a 4,000% increase in ominous strangers." },
        ],
        win: [
          { who: "betts", text: "Fetch my old charm tin from behind the bar. Time you learned the family recipe. Not the chowder. The OTHER recipe." },
        ],
        lose: [],
        reward: { xp: 240, coins: 90 },
      },

      {
        id: "c2b2", locationId: "club", type: "nertz", title: "Table Manners",
        intro: [
          { who: "betts", text: "Gran's rules: bank four cards to the middle, you charge a spark. ◆. That's table magic, old as felt." },
          { who: "betts", text: "Spend sparks to FROST a rival slow, FOG the whole table, or JINX their hands. Keys 1, 2, 3. Manners optional." },
          { who: "you", text: "Is this... allowed?" },
          { who: "betts", text: "Kid, the water is glowing. We're past 'allowed'. Beat me while cursed and you're ready." },
        ],
        win: [
          { who: "betts", text: "Ha! Frosted by my own grandkid. Beautiful. Terrible. Mostly beautiful." },
          { who: "crumbs", text: "( approving urp )" },
        ],
        lose: [
          { who: "betts", text: "The sparks won't spend themselves, kid. Bank four, hex one. Again." },
        ],
        nertz: { bots: [{ name: "Betts", avatar: "⚓", difficulty: "normal" }], rules: {}, haunt: true,
                 objective: { type: "win" } },
        reward: { xp: 260, coins: 95 },
      },

      {
        id: "c2b3", locationId: "chowder", type: "blackjack", title: "The Waiver",
        intro: [
          { who: "trent", text: "Before we play, please initial here, here, and... are you crying? There's a form for that." },
          { who: "you", text: "Trent. Your clipboard is upside down." },
          { who: "trent", text: "IT'S A STRESS POSITION. Look — Mr. Featherstonhaugh has been... borrowing. Luck. From a lender. A gray one." },
          { who: "trent", text: "Beat me at twenty-one and I'll tell you what I filed. I file everything. It's a sickness." },
        ],
        win: [
          { who: "trent", text: "Form 33-G: 'Transfer of Municipal Fortune.' Signed by a Featherstonhaugh in 1988. The ink is... still wet." },
          { who: "you", text: "1988?" },
          { who: "trent", text: "The ink. Is still. Wet." },
        ],
        lose: [
          { who: "trent", text: "Per section 4, losers learn nothing. I don't make the rules. I laminate them." },
        ],
        stake: 60, opponent: { name: "Trent", avatar: "📋" },
        reward: { xp: 280, coins: 100 },
      },

      {
        id: "c2b4", locationId: "pier", type: "nertz", title: "The Gray Hour",
        intro: [
          { who: "gus", text: "(whisper-announcing) THE CLOCKS HAVE ALL STOPPED AT 3:33. THE GULLS ARE FLYING BACKWARDS. FISH ARE POLITE NOW." },
          { who: "doreen", text: "A fish apologized to me. I've never felt so disrespected." },
          { who: "grayd", text: "...deal... us... in..." },
          { who: "betts", text: "Play through it, kid. A candle in fog beats a... a lighthouse in... just play through it." },
        ],
        win: [
          { who: "gus", text: "(whispering) THE CLOCKS MOVED. ONE MINUTE. WE TAKE OUR VICTORIES IN MINUTES NOW." },
        ],
        lose: [
          { who: "doreen", text: "The fog got in your chowder, hon. I mean your cards. Go again." },
        ],
        nertz: { bots: [
            { name: "Doreen", avatar: "🥣", difficulty: "normal" },
            { name: "Foghorn Gus", avatar: "📢", difficulty: "hard" },
          ], rules: { nertzSize: 16 }, haunt: true,
          objective: { type: "score", target: 22 } },
        reward: { xp: 300, coins: 105 },
      },

      {
        id: "c2b5", locationId: "lighthouse", type: "golf", title: "Signal Fire",
        intro: [
          { who: "milo", text: "The fog retreats 11.2% when the lamp burns. The lamp burns when someone clears the course. Old rule. Weird rule." },
          { who: "you", text: "Who wrote that rule?" },
          { who: "milo", text: "The lighthouse. Please don't ask it follow-ups." },
        ],
        win: [
          { who: "milo", text: "Lamp's lit. Fog's sulking. The gulls have resumed flying forward, mostly out of spite." },
        ],
        lose: [
          { who: "milo", text: "The lamp flickered and went out. The lighthouse says, quote, 'skill issue'. Again?" },
        ],
        stake: 75, config: { target: 26 },
        reward: { xp: 320, coins: 110, unlockTheme: "forest" },
      },

      {
        id: "c2b6", locationId: "marina", type: "dialogue", title: "Just Preston",
        intro: [
          { who: "preston", text: "It's pronounced Feather-STONE-haugh. No. FEATHERS-tun-hoff. No. It's..." },
          { who: "preston", text: "It's just Preston. My grandfather sold this town's luck to a gray man at a gray table. I've been paying interest ever since." },
          { who: "you", text: "The kelp smoothies?" },
          { who: "preston", text: "Collateral. Everything is collateral. The yacht is three canoes in a trench coat. Help me, and I'll help you." },
          { who: "betts", text: "A wise sailor once said... ah, forget the sailor. I say we take your hand, Preston. Both meanings." },
        ],
        win: [
          { who: "preston", text: "Thank you. Also please never tell anyone about the canoes." },
        ],
        lose: [],
        reward: { xp: 330, coins: 115 },
      },

      {
        id: "c2b7", locationId: "chowder", type: "poker", title: "The Collector Calls",
        intro: [
          { who: "collector", text: "( the door doesn't open. he is simply inside. ) Good evening. I buy luck. Fair rates. Firm handshakes." },
          { who: "collector", text: "Heard this one? Two fish are in a tank. One says... hm. It was funnier in 1988." },
          { who: "you", text: "Everything about you was funnier in 1988." },
          { who: "collector", text: "( writes that down in a gray ledger ) Five cards. If I win, I take the ace you love most. If you win... I leave a receipt." },
        ],
        win: [
          { who: "collector", text: "A receipt, as promised. It reads: 'THE DEALER WILL SEE YOU SOON.' Do keep it. It's redeemable." },
          { who: "crumbs", text: "( snatches the receipt. eats it. slow, defiant urp. )" },
        ],
        lose: [
          { who: "collector", text: "Pleasure doing business. ( the chair he sat in is somehow gone too ) " },
        ],
        stake: 85, opponent: { name: "The Collector", avatar: "🕴️" },
        reward: { xp: 350, coins: 120 },
      },

      {
        id: "c2b8", locationId: "club", type: "nertz", title: "The Grayed",
        intro: [
          { who: "doreen", text: "WE DEAL FOR THE DEALER." },
          { who: "gus", text: "WE DEAL FOR THE DEALER. (still somehow whispering)" },
          { who: "milo", text: "WE DEAL FOR THE DEALER. Statistically." },
          { who: "betts", text: "Their eyes've gone gray, kid. Beat them at the table and the table gives them back. That's the old law." },
          { who: "you", text: "And if I lose?" },
          { who: "betts", text: "Then we learn the chant too, and I hate group activities. WIN." },
        ],
        win: [
          { who: "doreen", text: "...why am I holding thirteen cards and WHY does my chowder glow?" },
          { who: "gus", text: "(whispering, relieved) I HAVE NEVER BEEN SO HAPPY TO HEAR MYSELF THINK." },
          { who: "betts", text: "Welcome back, you beautiful loudmouths." },
        ],
        lose: [
          { who: "grayd", text: "...one... more... chair... at... our... table..." },
          { who: "betts", text: "NOPE. Shake it off, kid. Again." },
        ],
        nertz: { bots: [
            { name: "Grayed Doreen", avatar: "🥣", difficulty: "hard" },
            { name: "Grayed Gus", avatar: "📢", difficulty: "hard" },
            { name: "Grayed Milo", avatar: "📊", difficulty: "normal" },
          ], rules: {}, haunt: true,
          objective: { type: "win" } },
        reward: { xp: 380, coins: 130, unlockTheme: "royal" },
      },

      {
        id: "c2b9", locationId: "baitshop", type: "nertz", title: "Turn the Tide",
        intro: [
          { who: "preston", text: "Before we face the Dealer, prove you can win with the tide against you. Single flips. My family's cursed shuffle." },
          { who: "ferdinand", text: "For the record, the post office has received 41 letters addressed to 'The Gray Gentleman, The Sea'. I deliver none of them." },
          { who: "preston", text: "Beat me under the clock, Tidebreaker-to-be. And I say that with 8% envy. 9." },
        ],
        win: [
          { who: "preston", text: "12% envy. You're ready. Tomorrow we play for the ledger itself." },
        ],
        lose: [
          { who: "preston", text: "The tide won that one. It's a good teacher and a sore winner. Again." },
        ],
        nertz: { bots: [
            { name: "Preston", avatar: "🎩", difficulty: "hard" },
            { name: "Betts", avatar: "⚓", difficulty: "normal" },
          ], rules: { stockFlip: 1 },
          objective: { type: "time", target: 150 } },
        reward: { xp: 400, coins: 140 },
      },

      {
        id: "c2b10", locationId: "club", type: "dialogue", title: "An Invitation, Gray",
        intro: [
          { who: "crumbs", text: "( drops a card into your hand. it was already in your pocket. it was always in your pocket. )" },
          { who: "grayd", text: "...the Dealer requests the pleasure... midnight... the table below the water feature... bring your luck... all of it..." },
          { who: "preston", text: "Below the—? There's no room below the... oh. Oh, there's always been a room below the water feature." },
          { who: "betts", text: "A wise sailor once said—" },
          { who: "betts", text: "No. No proverb. Kid: whatever you've got, we've got you. That's the whole saying. See you at midnight." },
          { who: "gus", text: "(the quietest he has ever been) good luck, kid." },
        ],
        win: [],
        lose: [],
        reward: { xp: 420, coins: 150, title: "Tidebreaker" },
      },
    ],
  };
})(typeof window !== "undefined" ? window : this);
