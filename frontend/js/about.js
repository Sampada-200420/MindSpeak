// ======================================================
// ABOUT PAGE
// Loads team members from the database
// ======================================================


async function loadTeamMembers() {

    const teamGrid =
        document.getElementById("teamGrid");


    if (!teamGrid) {
        return;
    }


    try {

        const response =
            await fetch(
                "http://127.0.0.1:8000/about/team"
            );


        if (!response.ok) {

            throw new Error(
                `Failed to load team members. Status: ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !data.team_members ||
            data.team_members.length === 0
        ) {

            teamGrid.innerHTML = `
                <p class="team-empty">
                    Our team information will be available soon.
                </p>
            `;

            return;

        }


        teamGrid.innerHTML = "";


        data.team_members.forEach(
            function (member, index) {

                const teamMember =
                    document.createElement("article");

                teamMember.className =
                    "team-member";


                const number =
                    String(index + 1).padStart(2, "0");


                teamMember.innerHTML = `

                    <div class="team-photo">

                        <img
                            src="${member.image}"
                            alt="${member.name} - ${member.role}"
                        >

                    </div>


                    <div class="team-info">

                        <span class="team-number">
                            ${number}
                        </span>

                        <h3>
                            ${member.name}
                        </h3>

                        <span class="team-role">
                            ${member.role}
                        </span>

                        <p>
                            ${member.description || ""}
                        </p>

                    </div>

                `;


                teamGrid.appendChild(
                    teamMember
                );

            }
        );


    } catch (error) {

        console.error(
            "Unable to load MindSpeak team:",
            error
        );


        teamGrid.innerHTML = `
            <p class="team-empty">
                Unable to load team information right now.
            </p>
        `;

    }

}


// ======================================================
// LOAD TEAM
// ======================================================

loadTeamMembers();