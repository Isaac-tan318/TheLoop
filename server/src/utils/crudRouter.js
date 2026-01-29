import express from 'express';

export function createCrudRouter(Model) {
  const router = express.Router();

  // List with basic filtering by exact match via query params
  router.get('/', async (req, res, next) => {
    try {
      const filter = { ...req.query };
      const docs = await Model.find(filter).lean({ virtuals: true });
      res.json(docs);
    } catch (err) {
      next(err);
    }
  });

  // Get by string id field "id"
  router.get('/:id', async (req, res, next) => {
    try {
      const doc = await Model.findById(req.params.id).lean({ virtuals: true });
      if (!doc) return res.status(404).json({ message: 'Not found' });
      res.json(doc);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const created = await Model.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const updated = await Model.findOneAndReplace({ _id: req.params.id }, req.body, {
        new: true,
        upsert: false,
      }).lean({ virtuals: true });
      if (!updated) return res.status(404).json({ message: 'Not found' });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id', async (req, res, next) => {
    try {
      const updated = await Model.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true,
      }).lean({ virtuals: true });
      if (!updated) return res.status(404).json({ message: 'Not found' });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const deleted = await Model.findOneAndDelete({ _id: req.params.id }).lean({ virtuals: true });
      if (!deleted) return res.status(404).json({ message: 'Not found' });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
