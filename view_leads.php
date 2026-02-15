<?php
session_start();

// Password Configuration
$PROTECTED_PASSWORD = "Tyughj098@@"; // Change this to something secure

// Handle Login
if (isset($_POST['password'])) {
    if ($_POST['password'] === $PROTECTED_PASSWORD) {
        $_SESSION['logged_in'] = true;
    } else {
        $error = "Mot de passe incorrect";
    }
}

// Handle Logout
if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: view_leads.php");
    exit;
}

// Handle CSV Download
if (isset($_GET['download']) && isset($_SESSION['logged_in'])) {
    $file = 'leads.csv';
    if (file_exists($file)) {
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="leads_export_' . date('Y-m-d') . '.csv"');
        readfile($file);
        exit;
    }
}

$isLoggedIn = isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
?>
<!DOCTYPE html>
<html lang="fr" dir="ltr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SyndiKi - Leads Viewer</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="styles.css">
    <style>
        body {
            padding: 40px 20px;
        }

        .login-box {
            max-width: 400px;
            margin: 100px auto;
            text-align: center;
        }

        .table-container {
            overflow-x: auto;
            margin-top: 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            color: var(--text-light);
        }

        th,
        td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid var(--glass-border);
        }

        th {
            background: rgba(59, 130, 246, 0.1);
            color: var(--primary);
        }

        tr:hover {
            background: rgba(255, 255, 255, 0.02);
        }
    </style>
</head>

<body>

    <?php if (!$isLoggedIn): ?>
        <div class="glass-card login-box">
            <h2 style="margin-bottom: 20px;"><i class="fa-solid fa-lock"></i> Accès Réservé</h2>
            <form method="POST">
                <input type="password" name="password" class="form-input" placeholder="Mot de passe" required
                    style="margin-bottom: 10px;">
                <?php if (isset($error)): ?>
                    <p style="color: #ef4444; margin-bottom: 10px;">
                        <?php echo $error; ?>
                    </p>
                <?php endif; ?>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Se Connecter</button>
            </form>
        </div>
    <?php else: ?>
        <div class="container">
            <div class="glass-card" style="padding: 30px;">
                <div
                    style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 20px;">
                    <h2><i class="fa-solid fa-users"></i> Demandes de Démo</h2>
                    <div style="display: flex; gap: 10px;">
                        <a href="?download=1" class="btn btn-success" style="background: #22c55e; color: white;">
                            <i class="fa-solid fa-download"></i> Exporter CSV
                        </a>
                        <a href="?logout=1" class="btn btn-secondary">
                            <i class="fa-solid fa-right-from-bracket"></i> Déconnexion
                        </a>
                    </div>
                </div>

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Immeuble</th>
                                <th>Type</th>
                                <th>Contact</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            $file = 'leads.csv';
                            if (file_exists($file)) {
                                $handle = fopen($file, "r");
                                $rows = [];
                                while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                                    $rows[] = $data;
                                }
                                fclose($handle);

                                // Show newest first
                                $rows = array_reverse($rows);

                                foreach ($rows as $row) {
                                    if (count($row) >= 4) {
                                        echo "<tr>";
                                        echo "<td>" . htmlspecialchars($row[0]) . "</td>";
                                        echo "<td>" . htmlspecialchars($row[1]) . "</td>";
                                        echo "<td>" . htmlspecialchars($row[2]) . "</td>";
                                        echo "<td>" . htmlspecialchars($row[3]) . "</td>";
                                        echo "</tr>";
                                    }
                                }
                            } else {
                                echo "<tr><td colspan='4' style='text-align: center; padding: 20px; color: var(--text-dim);'>Aucune demande pour le moment.</td></tr>";
                            }
                            ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    <?php endif; ?>

</body>

</html>