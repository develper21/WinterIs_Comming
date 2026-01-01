import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

// #region DebugController

/**
 * Debug Controller - Check database status
 */
export class DebugController {
    /**
     * Check if organization and hospital exist
     * GET /api/debug/check/:id
     */
    static async checkOrganizationAndHospital(req, res) {
        try {
            const { id } = req.params;
            const db = getDB();

            console.log('\n[DEBUG] Checking ID:', id);

            // Check organization
            const organization = await db.collection("organizations").findOne({
                _id: new ObjectId(id)
            });

            // Check hospital
            const hospital = await db.collection("hospitals").findOne({
                _id: new ObjectId(id)
            });

            // Get all hospitals count
            const hospitalsCount = await db.collection("hospitals").countDocuments();

            // Get all organizations count
            const orgsCount = await db.collection("organizations").countDocuments();

            const result = {
                id: id,
                organization: {
                    exists: !!organization,
                    data: organization ? {
                        _id: organization._id,
                        organizationCode: organization.organizationCode,
                        name: organization.name,
                        type: organization.type
                    } : null
                },
                hospital: {
                    exists: !!hospital,
                    data: hospital ? {
                        _id: hospital._id,
                        hospitalCode: hospital.hospitalCode,
                        name: hospital.name,
                        verificationStatus: hospital.verificationStatus
                    } : null
                },
                collections: {
                    totalOrganizations: orgsCount,
                    totalHospitals: hospitalsCount
                },
                issue: !hospital && organization ?
                    "Organization exists but Hospital document is missing" :
                    !organization ? "Organization doesn't exist" :
                        "Both exist - No issue"
            };

            console.log('[DEBUG] Result:', JSON.stringify(result, null, 2));

            res.json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('[DEBUG] Error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * List all hospitals
     * GET /api/debug/hospitals
     */
    static async listAllHospitals(req, res) {
        try {
            const db = getDB();

            const hospitals = await db.collection("hospitals")
                .find()
                .project({ name: 1, hospitalCode: 1, verificationStatus: 1 })
                .toArray();

            res.json({
                success: true,
                count: hospitals.length,
                data: hospitals
            });

        } catch (error) {
            console.error('[DEBUG] Error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * List all organizations
     * GET /api/debug/organizations
     */
    static async listAllOrganizations(req, res) {
        try {
            const db = getDB();

            const organizations = await db.collection("organizations")
                .find()
                .project({ name: 1, organizationCode: 1, type: 1 })
                .toArray();

            res.json({
                success: true,
                count: organizations.length,
                data: organizations
            });

        } catch (error) {
            console.error('[DEBUG] Error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}
