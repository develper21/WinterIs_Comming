import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

// #region SyncController

/**
 * Sync Controller - Sync organization to hospital
 */
export class SyncController {
    /**
     * Create hospital document from organization
     * POST /api/sync/create-hospital/:organizationId
     */
    static async createHospitalFromOrganization(req, res) {
        try {
            const { organizationId } = req.params;
            const db = getDB();

            console.log('\n[SYNC] Creating hospital for organization:', organizationId);

            // Check if organization exists
            const organization = await db.collection("organizations").findOne({
                _id: new ObjectId(organizationId)
            });

            if (!organization) {
                return res.status(404).json({
                    success: false,
                    message: "Organization not found"
                });
            }

            console.log('[SYNC] Organization found:', organization.name);

            // Check if organization type is hospital
            if (organization.type !== "hospital") {
                return res.status(400).json({
                    success: false,
                    message: `Organization type is '${organization.type}', not 'hospital'`
                });
            }

            // Check if hospital already exists
            const existingHospital = await db.collection("hospitals").findOne({
                _id: new ObjectId(organizationId)
            });

            if (existingHospital) {
                return res.status(400).json({
                    success: false,
                    message: "Hospital document already exists"
                });
            }

            // Create hospital document with same _id as organization
            const hospitalDocument = {
                _id: new ObjectId(organizationId),  // ← Same ID as organization
                hospitalCode: organization.organizationCode,
                name: organization.name,
                registrationNumber: organization.registrationNumber || `REG-${organization.organizationCode}`,
                email: organization.email || `contact@${organization.organizationCode.toLowerCase()}.com`,
                phone: organization.phone || "+91-0000000000",
                address: organization.address || "Address not provided",
                city: organization.city || "City not provided",
                verificationStatus: "VERIFIED",  // Auto-verify for existing organizations
                isActive: true,
                location: organization.location || {
                    type: "Point",
                    coordinates: [0, 0]  // Default coordinates
                },
                specialties: [],
                createdAt: organization.createdAt || new Date(),
                updatedAt: new Date()
            };

            // Insert hospital document
            const result = await db.collection("hospitals").insertOne(hospitalDocument);

            console.log('[SYNC] Hospital created successfully:', result.insertedId);

            res.json({
                success: true,
                message: "Hospital document created successfully",
                data: {
                    _id: result.insertedId,
                    hospitalCode: hospitalDocument.hospitalCode,
                    name: hospitalDocument.name,
                    verificationStatus: hospitalDocument.verificationStatus
                }
            });

        } catch (error) {
            console.error('[SYNC] Error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Sync all hospital-type organizations to hospitals collection
     * POST /api/sync/sync-all-hospitals
     */
    static async syncAllHospitals(req, res) {
        try {
            const db = getDB();

            console.log('\n[SYNC_ALL] Starting sync...');

            // Get all hospital-type organizations
            const organizations = await db.collection("organizations")
                .find({ type: "hospital" })
                .toArray();

            console.log(`[SYNC_ALL] Found ${organizations.length} hospital organizations`);

            const results = {
                total: organizations.length,
                created: 0,
                alreadyExists: 0,
                errors: []
            };

            for (const org of organizations) {
                try {
                    // Check if hospital already exists
                    const existingHospital = await db.collection("hospitals").findOne({
                        _id: org._id
                    });

                    if (existingHospital) {
                        console.log(`[SYNC_ALL] Hospital already exists: ${org.name}`);
                        results.alreadyExists++;
                        continue;
                    }

                    // Create hospital document
                    const hospitalDocument = {
                        _id: org._id,
                        hospitalCode: org.organizationCode,
                        name: org.name,
                        registrationNumber: org.registrationNumber || `REG-${org.organizationCode}`,
                        email: org.email || `contact@${org.organizationCode.toLowerCase()}.com`,
                        phone: org.phone || "+91-0000000000",
                        address: org.address || "Address not provided",
                        city: org.city || "City not provided",
                        verificationStatus: "VERIFIED",
                        isActive: true,
                        location: org.location || {
                            type: "Point",
                            coordinates: [0, 0]
                        },
                        specialties: [],
                        createdAt: org.createdAt || new Date(),
                        updatedAt: new Date()
                    };

                    await db.collection("hospitals").insertOne(hospitalDocument);
                    console.log(`[SYNC_ALL] Created hospital: ${org.name}`);
                    results.created++;

                } catch (error) {
                    console.error(`[SYNC_ALL] Error creating hospital for ${org.name}:`, error.message);
                    results.errors.push({
                        organization: org.name,
                        error: error.message
                    });
                }
            }

            console.log('[SYNC_ALL] Sync completed:', results);

            res.json({
                success: true,
                message: "Sync completed",
                data: results
            });

        } catch (error) {
            console.error('[SYNC_ALL] Error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}
