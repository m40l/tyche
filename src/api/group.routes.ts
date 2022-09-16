import * as express from 'express';
import { IUser } from '../models/User';
import Group, { IGroup } from '../models/Group';
import { HydratedDocument } from 'mongoose';

const groupRouter = express.Router();
groupRouter.use(express.json());

groupRouter.get('/', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;

    let groups = (
        await user.populate<{ groups: HydratedDocument<IGroup>[] }>({
            path: 'groups',
            populate: [{ path: 'admins' }, { path: 'users' }],
        })
    ).groups;
    return res.status(200).send(groups);
});

groupRouter.get('/:id', async (req, res) => {
    const id = req?.params?.id;
    const group = await Group.findById(id).populate(['users', 'admins']);
    if (!group) {
        return res.status(404).send();
    }
    const user = req.user as HydratedDocument<IUser>;

    if (group.users.includes(user._id)) {
        return res.status(200).send(group);
    } else {
        return res.status(400).send(`User is not part of group`);
    }
});

groupRouter.delete('/:id', async (req, res) => {
    const id = req?.params?.id;
    const group = await Group.findById(id);
    if (!group) {
        return res.status(404).send();
    }
    const user = req.user as HydratedDocument<IUser>;

    if (group.users.includes(user._id)) {
        group.users.splice(group.users.indexOf(user._id), 1);
        await group.save();
        return res.status(204).send();
    } else {
        res.status(400).send(`User is not part of group`);
    }
});

groupRouter.post('/', async (req, res) => {
    const groupName = req?.body?.name;
    Group.create({
        name: groupName,
        admins: [req.user],
        users: [req.user],
    })
        .then(() => {
            res.status(200).send();
        })
        .catch((err) => {
            res.status(400).send({
                message: 'Failed to create group',
                err: err,
            });
        });
});

export default groupRouter;
