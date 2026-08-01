import { Types } from 'mongoose';
import Membership from '../models/membership.model.js';
import type { ExpandMode } from '../types/membership.types.js';

// Internal method for the cascade deletion of a role
export const removeRoleFromMemberships = async (roleId: Types.ObjectId) => {
    // bulk gives performance (runs both operations as one batch) and safety (no intermediate state)
    return await Membership.bulkWrite([
        {
            // Remove the roleId from every rolesId array where it appears
            updateMany: { filter: { rolesId: roleId }, update: { $pull: { rolesId: roleId } } },
        },
        {
            // If a rolesId array is left orphan (empty), delete it
            deleteMany: { filter: { rolesId: { $size: 0 } } },
        },
    ]);
};

export const findMembership = async (orgId: Types.ObjectId, userId: Types.ObjectId) => {
    return await Membership.findOne({ organizationId: orgId, userId: userId });
};

export const findEspecificRole = async (
    orgId: Types.ObjectId,
    userId: Types.ObjectId,
    roleId: Types.ObjectId,
) => {
    return await Membership.findOne({ organizationId: orgId, userId: userId, rolesId: roleId });
};

export const createMembership = async (orgId: Types.ObjectId, userId: Types.ObjectId) => {
    return await Membership.create({ organizationId: orgId, userId: userId });
};

export const removeMembership = async (orgId: Types.ObjectId, userId: Types.ObjectId) => {
    return await Membership.deleteOne({ organizationId: orgId, userId: userId });
};

export const assignRole = async (
    userId: Types.ObjectId,
    orgId: Types.ObjectId,
    roleId: Types.ObjectId,
) => {
    // Use upsert: it creates the membership if it does not exist, and adds the role if it does
    return await Membership.findOneAndUpdate(
        { organizationId: orgId, userId: userId },
        { $addToSet: { rolesId: roleId } }, // addToSet prevents duplicates and initializes the array if needed
        { upsert: true, new: true },
    );
};

export const replaceRoles = async (
    organizationId: Types.ObjectId,
    userId: Types.ObjectId,
    rolesId: Types.ObjectId[],
) => {
    return await Membership.findOneAndUpdate(
        { organizationId, userId },
        { $set: { rolesId } },
        { new: true },
    );
};

export const removeMembershipsByOrganization = async (orgId: Types.ObjectId) => {
    return await Membership.deleteMany({ organizationId: orgId });
};

export const getMembershipsByOrganization = async (orgId: Types.ObjectId, expand: ExpandMode) => {
    const query = Membership.find({ organizationId: orgId });

    if (expand === 'full') {
        query.populate('organizationId');
    } else if (expand === 'names') {
        query.populate('organizationId', 'name');
    }

    return await query.exec();
};
export const findMembershipsByUser = async (userId: Types.ObjectId) => {
    return await Membership.find({ userId: userId });
};

export const countMembershipsByOrganizations = async (orgIds: Types.ObjectId[]) => {
    if (orgIds.length === 0) return [];

    return await Membership.aggregate<{ organizationId: Types.ObjectId; members: number }>([
        { $match: { organizationId: { $in: orgIds } } },
        { $group: { _id: '$organizationId', members: { $sum: 1 } } },
        { $project: { _id: 0, organizationId: '$_id', members: 1 } },
    ]);
};
