
// Mock Supabase Client
const supabase = {
    from: (table) => {
        return {
            insert: async (data) => {
                console.log('Mock Supabase Insert:', table, data);
                // Save to local storage for demo
                const scores = JSON.parse(localStorage.getItem('snow_beat_scores') || '[]');
                scores.push(data);
                localStorage.setItem('snow_beat_scores', JSON.stringify(scores));
                return { error: null };
            },
            select: () => {
                return {
                    order: (col, { ascending }) => {
                        return {
                            limit: async (n) => {
                                console.log('Mock Supabase Select:', table);
                                const scores = JSON.parse(localStorage.getItem('snow_beat_scores') || '[]');
                                scores.sort((a, b) => b.score - a.score);
                                return { data: scores.slice(0, n), error: null };
                            }
                        }
                    }
                }
            }
        };
    }
};

// Handle Save Score Button
document.getElementById('save-score-btn').addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const finalScore = parseInt(document.getElementById('final-score').innerText);

    if (!username) {
        alert('Please enter a name');
        return;
    }

    const { error } = await supabase.from('scores').insert({
        username: username,
        score: finalScore,
        created_at: new Date().toISOString()
    });

    if (error) {
        alert('Error saving score');
    } else {
        alert('Score saved! (Mock)');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
    }
});
