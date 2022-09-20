import * as express from 'express';
import { IUser } from '../models/User';
import Group, { IGroup } from '../models/Group';
import { HydratedDocument } from 'mongoose';
import { AddGroupRequest } from '../../types/requests';

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

//TODO This should be refactored to delete the group, not leave it. Leaving it as it is bc nobody cares about groups
groupRouter.delete('/:id', async (req, res) => {
    const id = req.params.id;
    const group = await Group.findById(id);
    if (!group) {
        return res.status(404).send();
    }
    const user = req.user as HydratedDocument<IUser>;

    group.removeUser(user._id.toHexString());
    await group.save();
    return res.status(204).send();
});

groupRouter.post('/', async (req, res) => {
    const addGroupRequest = req.body as AddGroupRequest;
    await Group.create({
        name: addGroupRequest.name,
        admins: [req.user],
        users: [req.user],
    });
    res.status(200).send();
});

export default groupRouter;
