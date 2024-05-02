
const express = require('express');
const router = express.Router();

const States = require('../models/States.js');
const statesData = require('../statesData.json');

const contiguousStates = ["AK", "HI"];



// Get states based on contiguous query parameter
router.get('/', async (req, res) => {
    if (req.query.contig) {
        const contiguous = req.query.contig === 'false' ? false : true;
        const filteredStates = statesData.filter(state => contiguous === contiguousStates.includes(state.code));
        const stateFunFacts = await States.find({}, 'stateCode funfacts');
        const mergedStates = filteredStates.map(state => {
            const matchingMongoDBState = stateFunFacts.find(s => s.stateCode === state.code);
            return { ...state, funfacts: matchingMongoDBState ? matchingMongoDBState.funfacts : [] };
        })
        return res.json(mergedStates);


    }
    // get all
    const stateFunFacts = await States.find({}, 'stateCode funfacts');

    const mergedStates = statesData.map(state => {
        const matchingMongoDBState = stateFunFacts.find(s => s.stateCode === state.code);
        return { ...state, funfacts: matchingMongoDBState ? matchingMongoDBState.funfacts : [] };
    });

    res.json(mergedStates);

});

// Get state by state code
router.get('/:state', async (req, res) => {
    const stateCode = req.params.state;

    const stateFunFact = await States.findOne({ state: stateCode }, 'funfacts');

    const state = statesData.find(s => s.code === stateCode);
    const mergedState = { ...state, funfacts: stateFunFact ? stateFunFact.funfacts : [] };

    if (mergedState) {
        res.json(mergedState);
    } else {
        res.status(404).json({ error: 'State not found' });
    }
});
//   Random funfact
router.get('/:state/funfact', async (req, res) => {
    const stateCode = req.params.state;
    const stateFunFacts = await States.findOne({ stateCode }, 'funfacts');

    if (stateFunFacts && stateFunFacts.funfacts.length > 0) {
        const randomIndex = Math.floor(Math.random() * stateFunFacts.funfacts.length);
        res.json({ funfact: stateFunFacts.funfacts[randomIndex] });
    } else {
        res.status(404).json({ error: 'No fun facts found for this state' });
    }
});
//   Get state capital
router.get('/:state/capital', async (req, res) => {
    const stateCode = req.params.state;

    const state = statesData.find(s => s.code === stateCode);

    if (state) {
        res.json({ state: state.state, capital: state.capital_city });
    } else {
        res.status(404).json({ error: 'State not found' });
    }
});
// get state nickname
router.get('/:state/nickname', async (req, res) => {
    const stateCode = req.params.state;

    const state = statesData.find(s => s.code === stateCode);

    if (state) {
        res.json({ state: state.state, nickname: state.nickname });
    } else {
        res.status(404).json({ error: 'State not found' });
    }
});

// Get state population
router.get('/:state/population', async (req, res) => {
    const stateCode = req.params.state;

    const state = statesData.find(s => s.code === stateCode);

    if (state) {
        res.json({ state: state.state, population: state.population });
    } else {
        res.status(404).json({ error: 'State not found' });
    }
});

//   Get state adm date
router.get('/:state/admission', async (req, res) => {
    const stateCode = req.params.state;

    const state = statesData.find(s => s.code === stateCode);

    if (state) {
        res.json({ state: state.state, admissions: state.admission_number });
    } else {
        res.status(404).json({ error: 'State not found' });
    }
});

//   add funfact on state
router.post('/:state/funfact', async (req, res) => {
    const stateCode = req.params.state;
    const { funfacts } = req.body;
    const body = req.body;
    console.log("funfact------------------------------------------->");
    console.log(body);

    if (!funfacts || !Array.isArray(funfacts) || funfacts.length === 0) {
        res.status(400).json({ error: 'Invalid funfacts data' });
        return;
    }

    const state = await States.findOne({ stateCode });

    if (state) {
        state.funfacts = state.funfacts.concat(funfacts);
        await state.save();
        res.json({ stateCode, funfacts: state.funfacts });
    } else {
        const newState = new States({ stateCode, funfacts, stateName: statesData.find(s => s.code === stateCode).state });
        await newState.save();
        res.status(201).json(newState);
        // res.status(201).json({ stateCode, funfacts: newState.funfacts });
    }
});
//   replace funfact on state
router.patch('/:state/funfact', async (req, res) => {
    const stateCode = req.params.state;
    const { index, funfact } = req.body;

    if (!index || !funfact || index == 0) {
        res.status(400).json({ error: 'Missing required fields: index and funfact' });
        return;
    }

    const state = await States.findOne({ stateCode });

    if (state) {
        if (index > 0 && index <= state.funfacts.length) {
            state.funfacts[index - 1] = funfact;
            await state.save();
            res.json({ stateCode, funfacts: state.funfacts });
        } else {
            res.status(400).json({ error: 'Invalid index' });
        }
    } else {
        res.status(404).json({ error: 'State not found' });
    }
});
//   Delete funfact from state
router.delete('/:state/funfact', async (req, res) => {
    const stateCode = req.params.state;
    const { index } = req.body;

    if (!index || index == 0) {
        res.status(400).json({ error: 'Missing required field: index' });
        return;
    }

    const state = await States.findOne({ stateCode });

    if (state) {
        if (index > 0 && index <= state.funfacts.length) {
            state.funfacts.splice(index - 1, 1);
            await state.save();
            res.json({ stateCode, funfacts: state.funfacts });
        } else {
            res.status(400).json({ error: 'Invalid index' });
        }
    } else {
        res.status(404).json({ error: 'State not found' });
    }
});

module.exports = router;