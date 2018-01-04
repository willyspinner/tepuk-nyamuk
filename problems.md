# 1. Make server-side piling.

### ~~TODO no. 1~~ - `DONE`

* implement server-side piling ( adding to the pile on every iThrew event), shuffling (upon match) and handing to loser socket (after match). ONLY IN SERVER. client - side totally unnecessary.

#### ~~issues~~ - `DONE`

* CONCURRENCY ISSUE HERE. WHAT IF app.set IS CALLED BEFORE app.get()?
** find any possible call-back functionality within io?
* concurrency issue no.2                           app.get('pile').push(card['card']);
** doesnt work. Why? perhaps app.set('pile',[]); isn't called yet. zzz

### ~~TODO no. 2~~ - `DONE`

* Continue with the game after this event happens. As in , prompt the user who lost to throw.

### TODO no. 3

* counters are faulty. Repair Them!

# 2. Make slapping 'fair' by taking into account socket latency, instead of blindlessly 'who emits first'.
### TODO no. 1
* CLIENT-SIDE: Make it relative to every player. For each player, record the time from the player getting the match event UNTIL the player slaps, then send this time taken to iSlap.
* SERVER-SIDE: then, loop thru all slapping times and the user having the slowest Slapping time loses. But, is there a more efficient way than O(n) looping? Perhaps merge sort and then retrieve end index elements?


# 3. O(n) deletion, etc.

### TODO no. 1

* see the problem @ app.js:48. Possibly go for a O(1) member access DS such as a hash/dict.

# 4. when a username has a space, undefined behaviour occurs.

### TODO no. 1

* fix lobby username registration.

# 5. CONSIDER. Do we even have to update the local copy? This is not efficient.
### TODO no. 1

* @game.ejs:107 try to figure out a way without these. Why have two copies -> server client?
