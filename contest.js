function get_array(size, seed) {
  var ar = []
  while (size--) ar.push(seed)

  return ar;
}

function extend(a, b) {
  for (prop in b) if (b.hasOwnProperty(prop))
    a[prop] = b[prop]

  return a
}

var state_proto = {
  size: 5,
  parent: null,
  models: null,
  checked: false,
  toArray: function(skip) {
    var ar = [],
        count = this.size

    while (count--) ar.push(get_array(this.size, 0))

    this.models.forEach(function(model, idx) {
      if (idx === skip) return;

      var paint = idx + 1,
          coords = [model.x, model.y],
          incidx = model.dir === 'horizontal' ? 0 : 1,
          count = 0

      while (count++ < model.length) {
        ar[coords[1]][coords[0]] = paint
        coords[incidx]++
      }
    })

    return ar
  },

  toString: function() {
    return this.toArray()
              .map(function(row) {
                return row
                        .map(function(num) {
                          return num < 10 ? '0' + num : num.toString()
                        })
                        .join(' ')
              })
              .join('\n')
  },

  getScore: function() {
    var score = 0,
        idx = this.size - 1,
        y = this.models[0].y,
        row = this.toArray()[y],
        point

    while ((point = row.pop()) !== 1)
      score += point === 0 ? 0.5 : (1 + (this.size - row.length))

    return score
  },

  printPath: function() {
    if (this.parent) this.parent.printPath()

    console.log(this.toString())
    console.log()
  },

  move: function(idx, amount) {
    if (idx >= this.models.length) return null

    var map = this.toArray(idx),
        model = this.models[idx],
        coords = [model.x, model.y],
        seek_point = [model.x, model.y],
        incidx = model.dir === 'horizontal' ? 0 : 1,
        count = 0

    seek_point[incidx] += amount > 0 ? model.length: -1

    while (count++ < Math.abs(amount)) {
      if ((Math.min.apply(null, seek_point) < 0) ||
          (Math.max.apply(null, seek_point) >= this.size)) return null

      if (map[seek_point[1]][seek_point[0]] !== 0) return null
      seek_point[incidx] += amount > 0 ? 1: -1
    }

    coords[incidx] += amount

    //ok, we can move the model there
    var new_model = extend({}, model),
        new_state = Object.create(state_proto),
        models_copy = function(models) {
          var cp = [],
              idx = -1

          while (models[++idx]) cp.push(models[idx])
          return cp
        }(this.models)

    new_model.x = coords[0]
    new_model.y = coords[1]

    models_copy[idx] = new_model
    extend(new_state, {
      checked: false,
      models: models_copy,
      parent: this
    })

    return new_state
  }
}

// >= 0
function get_score(state) {
}

function get_initial_state(size, models) {
  var state = Object.create(state_proto)

  state_proto.size = size

  extend(state, {
    checked: true,
    models: models //first model is always player
  })

  return state
}

function get_possible_states(state) {
  return [].concat.apply([], state.models.map(function(model, idx) {
    var moves = [],
        step = 0

    while (move = state.move(idx, ++step)) moves.push(move)

    step = 0
    while (move = state.move(idx, --step)) moves.push(move)

    return moves
  }));
}

function find_new_state(known_states) {
  return known_states.states
          .filter(function(st) { return st.checked === false })
          .sort(function(a,b) { return a.score - b.score })
          .shift()
}

function merge_states(known_states, new_states) {
  new_states.forEach(function(st) {
    var hash = st.toString()

    if (!known_states.map.hasOwnProperty(hash)) {
      known_states.map[hash] = known_states.states.length
      known_states.states.push(st)
    }
  })
}

function expand(state, known_states) {
  state.checked = true

  var new_states = get_possible_states(state),
      idx, next_state, winners

  known_states = known_states || {
    states: [],
    map: {}
  }

  winners = new_states
    .filter(function(st) {
      return st.getScore() === 0
    })

  if (winners.length) return winners[0]

  merge_states(known_states, new_states)
  next_state = find_new_state(known_states)

  if (!next_state) return null

  return expand(next_state, known_states)
}

var data = require('./' + process.argv[2]),
    state = get_initial_state(data.size, data.models)

console.log('initial state:')
console.log(state.toString())

var result = expand(state)

if (!result) {
  console.log('Path not found')
} else {
  console.log('Solution:')
  result.printPath()
}

process.exit(0)
