from fastapi import APIRouter, HTTPException
from database import get_connection

router = APIRouter(
    prefix="/api/contact",
    tags=["Contact Applications"]
)


@router.post("/applications")
def submit_application(data: dict):

    # -----------------------------------------
    # GET DATA
    # -----------------------------------------

    application_type = data.get("application_type")
    user_id = data.get("user_id")

    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    organization = data.get("organization")
    motivation = data.get("motivation")
    experience = data.get("experience")
    skills = data.get("skills")
    availability = data.get("availability")
    additional_information = data.get("additional_information")


    # -----------------------------------------
    # VALIDATION
    # -----------------------------------------

    allowed_types = [
        "volunteer",
        "core_team",
        "technical_support",
        "partner",
        "professional"
    ]

    if application_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid application type."
        )

    if not name or not str(name).strip():
        raise HTTPException(
            status_code=400,
            detail="Name is required."
        )

    if not email or not str(email).strip():
        raise HTTPException(
            status_code=400,
            detail="Email is required."
        )

    if not motivation or not str(motivation).strip():
        raise HTTPException(
            status_code=400,
            detail="Motivation is required."
        )


    # -----------------------------------------
    # DATABASE CONNECTION
    # -----------------------------------------

    connection = get_connection()

    if connection is None:
        raise HTTPException(
            status_code=500,
            detail="Could not connect to the database."
        )


    cursor = None

    try:

        cursor = connection.cursor()


        # -----------------------------------------
        # INSERT APPLICATION
        # -----------------------------------------

        query = """
            INSERT INTO join_applications (
                user_id,
                application_type,
                name,
                email,
                phone,
                organization,
                motivation,
                experience,
                skills,
                availability,
                additional_information,
                status,
                created_at,
                updated_at
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                'pending',
                NOW(),
                NOW()
            )
        """

        values = (
            user_id,
            application_type,
            name.strip(),
            email.strip(),
            phone.strip() if phone else None,
            organization.strip() if organization else None,
            motivation.strip(),
            experience.strip() if experience else None,
            skills.strip() if skills else None,
            availability if availability else None,
            additional_information.strip()
            if additional_information
            else None
        )


        cursor.execute(query, values)

        application_id = cursor.lastrowid

        connection.commit()


        # -----------------------------------------
        # SUCCESS RESPONSE
        # -----------------------------------------

        return {
            "success": True,
            "message": "Application submitted successfully.",
            "application_id": application_id,
            "application_type": application_type
        }


    except Exception as e:

        connection.rollback()

        print(
            "CONTACT APPLICATION ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit application: {str(e)}"
        )


    finally:

        if cursor:
            cursor.close()

        connection.close()


# -----------------------------------------
# APPLICATION TYPES
# -----------------------------------------

@router.get("/application-types")
def get_application_types():

    return {
        "success": True,
        "application_types": [
            {
                "value": "volunteer",
                "label": "Volunteer"
            },
            {
                "value": "core_team",
                "label": "Core Team"
            },
            {
                "value": "technical_support",
                "label": "Technical Support"
            },
            {
                "value": "partner",
                "label": "Partner"
            },
            {
                "value": "professional",
                "label": "Professional"
            }
        ]
    }